/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Notice } from "@components/Notice";
import { AllicordDevs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { find, findByCodeLazy } from "@webpack";
import { ApplicationStreamingStore, ChannelStore, FluxDispatcher, GuildChannelStore, RestAPI, RunningGameStore, showToast } from "@webpack/common";

type TaskName = "WATCH_VIDEO" | "WATCH_VIDEO_ON_MOBILE" | "PLAY_ON_DESKTOP" | "STREAM_ON_DESKTOP" | "PLAY_ACTIVITY";

interface QuestTask {
    target: number;
    applications?: { id: string; name: string; }[];
}

interface TaskConfig {
    tasks: Partial<Record<TaskName, QuestTask>>;
}

interface Quest {
    id: string;
    config: {
        expiresAt: string;
        configVersion: number;
        application?: { id: string; name: string; };
        messages: { questName: string; };
        taskConfig?: TaskConfig;
        taskConfigV2?: TaskConfig;
    };
    userStatus?: {
        enrolledAt?: string;
        completedAt?: string;
        streamProgressSeconds?: number;
        progress?: Record<string, { value: number; }>;
    };
}

const logger = new Logger("QuestCompleter");

const fetchQuests = findByCodeLazy("QUESTS_FETCH_CURRENT_QUESTS_BEGIN") as () => Promise<unknown>;

const SCAN_INTERVAL = 60_000;
const MIN_FETCH_MINUTES = 30;
const ENROLL_RETRIES = 3;

const settings = definePluginSettings({
    autoAccept: {
        type: OptionType.BOOLEAN,
        description: "Accept new quests automatically",
        default: false
    },
    videos: {
        type: OptionType.BOOLEAN,
        description: "Complete video quests",
        default: true
    },
    activities: {
        type: OptionType.BOOLEAN,
        description: "Complete activity quests",
        default: true
    },
    playOnDesktop: {
        type: OptionType.BOOLEAN,
        description: "Complete play quests (desktop app only)",
        default: true
    },
    streamOnDesktop: {
        type: OptionType.BOOLEAN,
        description: "Complete stream quests (desktop app only, needs someone else in the call)",
        default: true
    },
    fetchIntervalMinutes: {
        type: OptionType.NUMBER,
        description: `How often to look for new quests, in minutes (at least ${MIN_FETCH_MINUTES})`,
        default: 120
    },
    logProgress: {
        type: OptionType.BOOLEAN,
        description: "Log quest progress to the console",
        default: true
    }
});

const taskSettings = {
    WATCH_VIDEO: "videos",
    WATCH_VIDEO_ON_MOBILE: "videos",
    PLAY_ACTIVITY: "activities",
    PLAY_ON_DESKTOP: "playOnDesktop",
    STREAM_ON_DESKTOP: "streamOnDesktop"
} as const satisfies Record<TaskName, keyof typeof settings.store>;

let questStore: any;
let controller: AbortController | null = null;
let scanTimer: ReturnType<typeof setInterval> | undefined;
let fetchTimer: ReturnType<typeof setInterval> | undefined;
let desktopLane: Promise<void> = Promise.resolve();

const running = new Set<string>();

function getQuestStore() {
    questStore ??= find((m: any) => m?.quests instanceof Map && typeof m.getQuest === "function", { isIndirect: true });
    return questStore;
}

function log(...args: unknown[]) {
    if (settings.store.logProgress) logger.log(...args);
}

function sleep(ms: number, signal: AbortSignal) {
    return new Promise<void>(resolve => {
        const timeout = setTimeout(done, ms);

        function done() {
            clearTimeout(timeout);
            signal.removeEventListener("abort", done);
            resolve();
        }

        signal.addEventListener("abort", done);
    });
}

function getTaskConfig(quest: Quest) {
    return quest.config.taskConfig ?? quest.config.taskConfigV2;
}

function getTask(quest: Quest) {
    const tasks = getTaskConfig(quest)?.tasks;
    if (!tasks) return null;

    for (const name of Object.keys(taskSettings) as TaskName[]) {
        const task = tasks[name];
        if (task && settings.store[taskSettings[name]] && (IS_DISCORD_DESKTOP || !name.endsWith("DESKTOP"))) {
            return { name, task };
        }
    }

    return null;
}

function isActive(quest: Quest) {
    return !quest.userStatus?.completedAt && new Date(quest.config.expiresAt).getTime() > Date.now();
}

function getProgress(quest: Quest, taskName: TaskName, event: { userStatus: NonNullable<Quest["userStatus"]>; }) {
    return quest.config.configVersion === 1
        ? event.userStatus.streamProgressSeconds ?? 0
        : Math.floor(event.userStatus.progress?.[taskName]?.value ?? 0);
}

async function enroll(quest: Quest, signal: AbortSignal) {
    const { questName } = quest.config.messages;

    for (let attempt = 1; attempt <= ENROLL_RETRIES; attempt++) {
        try {
            await RestAPI.post({
                url: `/quests/${quest.id}/enroll`,
                body: {
                    location: 11,
                    is_targeted: false,
                    metadata_raw: null,
                    metadata_sealed: null,
                    traffic_metadata_raw: null
                }
            });
            log(`Accepted ${questName}`);
            return true;
        } catch (e: any) {
            const status = e?.status ?? e?.res?.status;
            if (status !== 429) {
                logger.error(`Could not accept ${questName}`, e?.body?.message ?? e);
                return false;
            }

            const wait = ((e?.body?.retry_after ?? e?.res?.body?.retry_after ?? 5) + 1) * 1000;
            log(`Rate limited accepting ${questName}, retrying in ${Math.ceil(wait / 1000)}s`);
            await sleep(wait, signal);
            if (signal.aborted) return false;
        }
    }

    return false;
}

function waitForHeartbeat(quest: Quest, taskName: TaskName, target: number, signal: AbortSignal) {
    return new Promise<void>(resolve => {
        function done() {
            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
            signal.removeEventListener("abort", done);
            resolve();
        }

        function onHeartbeat(event: any) {
            if (event.questId !== quest.id) return;

            try {
                const progress = getProgress(quest, taskName, event);
                log(`${quest.config.messages.questName}: ${progress}/${target}`);
                if (progress >= target) done();
            } catch (e) {
                logger.error("Could not read progress", e);
                done();
            }
        }

        FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
        signal.addEventListener("abort", done);
    });
}

async function completeVideo(quest: Quest, target: number, signal: AbortSignal) {
    const maxAhead = 10;
    const step = 7;
    const enrolledAt = new Date(quest.userStatus!.enrolledAt!).getTime();
    let done = quest.userStatus?.progress?.WATCH_VIDEO?.value ?? quest.userStatus?.progress?.WATCH_VIDEO_ON_MOBILE?.value ?? 0;
    let completed = false;

    while (!signal.aborted && done < target) {
        const allowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxAhead;

        if (allowed - done >= step) {
            const timestamp = Math.min(target, done + step);
            const res = await RestAPI.post({
                url: `/quests/${quest.id}/video-progress`,
                body: { timestamp: Math.min(target, timestamp + Math.random()) }
            });
            completed = res.body?.completed_at != null;
            done = timestamp;
            log(`${quest.config.messages.questName}: ${done}/${target}`);
        }

        await sleep(1000, signal);
    }

    if (!signal.aborted && !completed) {
        await RestAPI.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: target } });
    }
}

async function completeActivity(quest: Quest, target: number, signal: AbortSignal) {
    const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id
        ?? Object.values(GuildChannelStore.getAllGuilds() as Record<string, any>).find(g => g?.VOCAL?.length)?.VOCAL[0]?.channel?.id;

    if (!channelId) {
        logger.warn(`No channel available for ${quest.config.messages.questName}`);
        return;
    }

    const streamKey = `call:${channelId}:1`;

    while (!signal.aborted) {
        const res = await RestAPI.post({
            url: `/quests/${quest.id}/heartbeat`,
            body: { stream_key: streamKey, terminal: false }
        });
        const progress = res.body.progress.PLAY_ACTIVITY.value;
        log(`${quest.config.messages.questName}: ${progress}/${target}`);

        if (progress >= target) {
            await RestAPI.post({
                url: `/quests/${quest.id}/heartbeat`,
                body: { stream_key: streamKey, terminal: true }
            });
            return;
        }

        await sleep(20_000, signal);
    }
}

async function completePlay(quest: Quest, applicationId: string, target: number, signal: AbortSignal) {
    const res = await RestAPI.get({ url: `/applications/public?application_ids=${applicationId}` });
    const app = res.body?.[0];
    if (!app || signal.aborted) return;

    const exeName = (app.executables?.find((e: any) => e.os === "win32") ?? app.executables?.[0])?.name?.replace(">", "")
        ?? `${app.name.replace(/[/\\:*?"<>|]/g, "")}.exe`;
    const pid = Math.floor(Math.random() * 30000) + 1000;
    const game = {
        cmdLine: `C:\\Program Files\\${app.name}\\${exeName}`,
        exeName,
        exePath: `c:/program files/${app.name.toLowerCase()}/${exeName}`,
        hidden: false,
        isLauncher: false,
        id: applicationId,
        name: app.name,
        pid,
        pidPath: [pid],
        processName: app.name,
        start: Date.now()
    };

    const store = RunningGameStore as any;
    const { getRunningGames, getGameForPID } = store;
    const real = getRunningGames.call(store);

    store.getRunningGames = () => [game];
    store.getGameForPID = (p: number) => p === pid ? game : null;
    FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: real, added: [game], games: [game] });

    try {
        await waitForHeartbeat(quest, "PLAY_ON_DESKTOP", target, signal);
    } finally {
        store.getRunningGames = getRunningGames;
        store.getGameForPID = getGameForPID;
        FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [game], added: getRunningGames.call(store), games: getRunningGames.call(store) });
    }
}

async function completeStream(quest: Quest, applicationId: string, target: number, signal: AbortSignal) {
    const store = ApplicationStreamingStore as any;
    const { getStreamerActiveStreamMetadata } = store;

    store.getStreamerActiveStreamMetadata = () => ({
        id: applicationId,
        pid: Math.floor(Math.random() * 30000) + 1000,
        sourceName: null
    });

    try {
        await waitForHeartbeat(quest, "STREAM_ON_DESKTOP", target, signal);
    } finally {
        store.getStreamerActiveStreamMetadata = getStreamerActiveStreamMetadata;
    }
}

async function runQuest(quest: Quest, signal: AbortSignal) {
    const found = getTask(quest);
    if (!found || signal.aborted) return;

    const { name, task } = found;
    const { questName } = quest.config.messages;
    const applicationId = quest.config.application?.id ?? task.applications?.[0]?.id ?? "";

    try {
        log(`Working on ${questName} (${name})`);

        switch (name) {
            case "WATCH_VIDEO":
            case "WATCH_VIDEO_ON_MOBILE":
                await completeVideo(quest, task.target, signal);
                break;
            case "PLAY_ACTIVITY":
                await completeActivity(quest, task.target, signal);
                break;
            case "PLAY_ON_DESKTOP":
                await completePlay(quest, applicationId, task.target, signal);
                break;
            case "STREAM_ON_DESKTOP":
                await completeStream(quest, applicationId, task.target, signal);
                break;
        }

        if (!signal.aborted) log(`Finished ${questName}`);
    } catch (e) {
        logger.error(`Could not complete ${questName}`, e);
    }
}

function startQuest(quest: Quest, signal: AbortSignal) {
    const { name } = getTask(quest)!;
    running.add(quest.id);

    const job = () => runQuest(quest, signal).finally(() => running.delete(quest.id));

    // Games and streams replace what the client thinks is running, so they take turns
    if (name === "PLAY_ON_DESKTOP" || name === "STREAM_ON_DESKTOP") {
        desktopLane = desktopLane.then(job);
    } else {
        job();
    }
}

async function scan() {
    const store = getQuestStore();
    const signal = controller?.signal;
    if (!store?.quests || !signal) return;

    const quests = ([...store.quests.values()] as Quest[]).filter(q => isActive(q) && getTask(q));

    if (settings.store.autoAccept) {
        for (const quest of quests.filter(q => !q.userStatus?.enrolledAt)) {
            if (signal.aborted) return;
            await enroll(quest, signal);
            await sleep(3000, signal);
        }
    }

    for (const quest of quests) {
        const current: Quest = store.quests.get(quest.id) ?? quest;
        if (current.userStatus?.enrolledAt && isActive(current) && !running.has(current.id)) {
            startQuest(current, signal);
        }
    }
}

async function refresh() {
    try {
        await fetchQuests();
    } catch (e) {
        logger.error("Could not fetch quests", e);
        return;
    }

    await scan();
}

function scheduleFetch() {
    clearInterval(fetchTimer);
    const minutes = Math.max(MIN_FETCH_MINUTES, settings.store.fetchIntervalMinutes ?? 120);
    fetchTimer = setInterval(refresh, minutes * 60_000);
}

export default definePlugin({
    name: "QuestCompleter",
    description: "Completes your Discord quests in the background",
    tags: ["Utility"],
    authors: [AllicordDevs.Flibat],
    settings,
    settingsAboutComponent: () => (
        <Notice.Warning>
            Automating quests goes against Discord's rules and can get your account flagged. Use it at your own risk.
        </Notice.Warning>
    ),
    toolboxActions: {
        async "Check For Quests"() {
            await refresh();
            showToast("Checked for new quests", "success");
        }
    },
    start() {
        controller = new AbortController();
        scanTimer = setInterval(scan, SCAN_INTERVAL);
        scheduleFetch();
        refresh();
    },
    stop() {
        controller?.abort();
        controller = null;
        clearInterval(scanTimer);
        clearInterval(fetchTimer);
        running.clear();
        desktopLane = Promise.resolve();
    }
});
