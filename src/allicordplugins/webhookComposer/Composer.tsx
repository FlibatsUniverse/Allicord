/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { Button } from "@components/Button";
import ErrorBoundary from "@components/ErrorBoundary";
import { classNameFactory } from "@utils/css";
import { copyWithToast } from "@utils/discord";
import type { PluginNative } from "@utils/types";
import type { RenderModalProps } from "@vencord/discord-types";
import { ColorPicker, Modal, openModal, Parser, TextArea, TextInput, useMemo, useState } from "@webpack/common";

import { Embed, EmbedField, Webhook, WebhookMessage } from "./types";

const cl = classNameFactory("vc-webhook-composer-");

const MAX_CONTENT = 2000;
const MAX_EMBEDS = 10;
const MAX_FIELDS = 25;
const MAX_EMBED_TOTAL = 6000;

function toHex(color?: number) {
    return `#${(color ?? 0x5865f2).toString(16).padStart(6, "0")}`;
}

function countEmbedCharacters(embed: Embed) {
    return (embed.title?.length ?? 0)
        + (embed.description?.length ?? 0)
        + (embed.author?.name?.length ?? 0)
        + (embed.footer?.text?.length ?? 0)
        + (embed.fields ?? []).reduce((total, f) => total + f.name.length + f.value.length, 0);
}

function clean(message: WebhookMessage): WebhookMessage {
    const embeds = message.embeds
        .map(e => ({
            ...e,
            fields: e.fields?.filter(f => f.name.trim() && f.value.trim()),
            author: e.author?.name?.trim() ? e.author : undefined,
            footer: e.footer?.text?.trim() ? e.footer : undefined,
            image: e.image?.url?.trim() ? e.image : undefined,
            thumbnail: e.thumbnail?.url?.trim() ? e.thumbnail : undefined
        }))
        .filter(e => countEmbedCharacters(e) > 0 || e.image || e.thumbnail);

    return {
        username: message.username?.trim() || undefined,
        avatar_url: message.avatar_url?.trim() || undefined,
        content: message.content?.trim() || undefined,
        embeds: embeds.length ? embeds : undefined
    } as WebhookMessage;
}

function validate(message: WebhookMessage) {
    const embeds = message.embeds ?? [];
    if (!message.content && !embeds.length) return "Write a message or add an embed first.";
    if ((message.content?.length ?? 0) > MAX_CONTENT) return `Messages can be at most ${MAX_CONTENT} characters.`;
    if (embeds.reduce((total, e) => total + countEmbedCharacters(e), 0) > MAX_EMBED_TOTAL) {
        return `Embeds can have at most ${MAX_EMBED_TOTAL} characters in total.`;
    }
}

function Field({ label, children }: { label: string; children: React.ReactNode; }) {
    return (
        <label className={cl("field")}>
            <span className={cl("label")}>{label}</span>
            {children}
        </label>
    );
}

function EmbedEditor({ embed, index, onChange, onRemove }: {
    embed: Embed;
    index: number;
    onChange(embed: Embed): void;
    onRemove(): void;
}) {
    const [open, setOpen] = useState(index === 0);
    const fields = embed.fields ?? [];

    const setField = (i: number, patch: Partial<EmbedField>) =>
        onChange({ ...embed, fields: fields.map((f, j) => j === i ? { ...f, ...patch } : f) });

    return (
        <div className={cl("embed")}>
            <div className={cl("embed-bar")}>
                <button type="button" className={cl("embed-toggle")} onClick={() => setOpen(!open)}>
                    {open ? "▾" : "▸"} {embed.title || `Embed ${index + 1}`}
                </button>
                <Button size="min" variant="dangerSecondary" onClick={onRemove}>Remove</Button>
            </div>

            {open && (
                <div className={cl("embed-body")}>
                    <div className={cl("row")}>
                        <Field label="Title">
                            <TextInput value={embed.title ?? ""} maxLength={256} onChange={(title: string) => onChange({ ...embed, title })} />
                        </Field>
                        <Field label="Title link">
                            <TextInput value={embed.url ?? ""} onChange={(url: string) => onChange({ ...embed, url })} />
                        </Field>
                        <Field label="Color">
                            <ColorPicker
                                color={embed.color ?? 0x5865f2}
                                onChange={(color: number) => onChange({ ...embed, color })}
                                showEyeDropper
                            />
                        </Field>
                    </div>

                    <Field label="Description">
                        <TextArea value={embed.description ?? ""} rows={3} maxLength={4096} onChange={(description: string) => onChange({ ...embed, description })} />
                    </Field>

                    <div className={cl("row")}>
                        <Field label="Author">
                            <TextInput value={embed.author?.name ?? ""} maxLength={256} onChange={(name: string) => onChange({ ...embed, author: { ...embed.author, name } })} />
                        </Field>
                        <Field label="Author icon URL">
                            <TextInput value={embed.author?.icon_url ?? ""} onChange={(icon_url: string) => onChange({ ...embed, author: { name: "", ...embed.author, icon_url } })} />
                        </Field>
                    </div>

                    <div className={cl("row")}>
                        <Field label="Image URL">
                            <TextInput value={embed.image?.url ?? ""} onChange={(url: string) => onChange({ ...embed, image: { url } })} />
                        </Field>
                        <Field label="Thumbnail URL">
                            <TextInput value={embed.thumbnail?.url ?? ""} onChange={(url: string) => onChange({ ...embed, thumbnail: { url } })} />
                        </Field>
                    </div>

                    <div className={cl("row")}>
                        <Field label="Footer">
                            <TextInput value={embed.footer?.text ?? ""} maxLength={2048} onChange={(text: string) => onChange({ ...embed, footer: { ...embed.footer, text } })} />
                        </Field>
                        <Field label="Footer icon URL">
                            <TextInput value={embed.footer?.icon_url ?? ""} onChange={(icon_url: string) => onChange({ ...embed, footer: { text: "", ...embed.footer, icon_url } })} />
                        </Field>
                    </div>

                    <span className={cl("label")}>Fields</span>
                    {fields.map((field, i) => (
                        <div key={i} className={cl("field-row")}>
                            <TextInput placeholder="Name" value={field.name} maxLength={256} onChange={(name: string) => setField(i, { name })} />
                            <TextInput placeholder="Value" value={field.value} maxLength={1024} onChange={(value: string) => setField(i, { value })} />
                            <label className={cl("inline")}>
                                <input type="checkbox" checked={!!field.inline} onChange={e => setField(i, { inline: e.currentTarget.checked })} />
                                Inline
                            </label>
                            <Button size="min" variant="dangerSecondary" onClick={() => onChange({ ...embed, fields: fields.filter((_, j) => j !== i) })}>✕</Button>
                        </div>
                    ))}
                    {fields.length < MAX_FIELDS && (
                        <Button size="small" variant="secondary" onClick={() => onChange({ ...embed, fields: [...fields, { name: "", value: "", inline: false }] })}>
                            Add field
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

function EmbedPreview({ embed }: { embed: Embed; }) {
    const fields = embed.fields?.filter(f => f.name.trim() || f.value.trim()) ?? [];

    return (
        <div className={cl("preview-embed")} style={{ borderLeftColor: toHex(embed.color) }}>
            <div className={cl("preview-embed-main")}>
                {embed.author?.name && (
                    <div className={cl("preview-author")}>
                        {embed.author.icon_url && <img src={embed.author.icon_url} alt="" />}
                        {embed.author.name}
                    </div>
                )}
                {embed.title && (
                    <div className={cl("preview-title")}>
                        {embed.url ? <a href={embed.url} target="_blank" rel="noreferrer">{embed.title}</a> : embed.title}
                    </div>
                )}
                {embed.description && <div className={cl("preview-description")}>{Parser.parse(embed.description)}</div>}
                {fields.length > 0 && (
                    <div className={cl("preview-fields")}>
                        {fields.map((f, i) => (
                            <div key={i} className={cl(f.inline ? "preview-field-inline" : "preview-field")}>
                                <div className={cl("preview-field-name")}>{f.name}</div>
                                <div>{Parser.parse(f.value)}</div>
                            </div>
                        ))}
                    </div>
                )}
                {embed.image?.url && <img className={cl("preview-image")} src={embed.image.url} alt="" />}
                {embed.footer?.text && (
                    <div className={cl("preview-footer")}>
                        {embed.footer.icon_url && <img src={embed.footer.icon_url} alt="" />}
                        {embed.footer.text}
                    </div>
                )}
            </div>
            {embed.thumbnail?.url && <img className={cl("preview-thumbnail")} src={embed.thumbnail.url} alt="" />}
        </div>
    );
}

function Preview({ webhook, message }: { webhook: Webhook; message: WebhookMessage; }) {
    const avatar = message.avatar_url?.trim()
        || (webhook.avatar ? `https://cdn.discordapp.com/avatars/${webhook.id}/${webhook.avatar}.png?size=80` : undefined);

    return (
        <div className={cl("preview")}>
            <div className={cl("preview-avatar")} style={avatar ? { backgroundImage: `url(${avatar})` } : undefined} />
            <div className={cl("preview-body")}>
                <div className={cl("preview-head")}>
                    <span className={cl("preview-name")}>{message.username?.trim() || webhook.name}</span>
                    <span className={cl("preview-tag")}>APP</span>
                </div>
                {message.content && <div className={cl("preview-content")}>{Parser.parse(message.content)}</div>}
                {message.embeds.map((embed, i) => <EmbedPreview key={i} embed={embed} />)}
            </div>
        </div>
    );
}

// Discord rejects webhook requests that come from the app's own origin, so they go out from the main process
async function sendMessage(webhook: Webhook, message: WebhookMessage) {
    const url = `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}?wait=true`;
    const payload = JSON.stringify(clean(message));

    const native = IS_DISCORD_DESKTOP
        ? VencordNative.pluginHelpers.WebhookComposer as PluginNative<typeof import("./native")>
        : undefined;

    const { status, body } = native
        ? await native.sendWebhook(url, payload)
        : await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload })
            .then(async res => ({ status: res.status, body: await res.text() }));

    if (status < 200 || status >= 300) {
        let reason = "";
        try {
            reason = JSON.parse(body)?.message ?? "";
        } catch { }
        throw new Error(reason || `Discord answered with status ${status}`);
    }
}

function Composer({ webhook, modalProps }: { webhook: Webhook; modalProps: RenderModalProps; }) {
    const [message, setMessage] = useState<WebhookMessage>({ content: "", embeds: [] });
    const [status, setStatus] = useState<{ ok: boolean; text: string; } | null>(null);
    const [sending, setSending] = useState(false);
    const [importText, setImportText] = useState<string | null>(null);

    const cleaned = useMemo(() => clean(message), [message]);
    const problem = validate(cleaned);

    const update = (patch: Partial<WebhookMessage>) => {
        setMessage({ ...message, ...patch });
        setStatus(null);
    };

    async function send() {
        setSending(true);
        try {
            await sendMessage(webhook, message);
            setStatus({ ok: true, text: "Message sent." });
        } catch (e) {
            setStatus({ ok: false, text: e instanceof Error ? e.message : String(e) });
        } finally {
            setSending(false);
        }
    }

    function applyImport() {
        try {
            const data = JSON.parse(importText ?? "");
            setMessage({
                username: data.username,
                avatar_url: data.avatar_url,
                content: data.content ?? "",
                embeds: Array.isArray(data.embeds) ? data.embeds.slice(0, MAX_EMBEDS) : []
            });
            setImportText(null);
            setStatus(null);
        } catch {
            setStatus({ ok: false, text: "That is not valid JSON." });
        }
    }

    return (
        <Modal
            {...modalProps}
            size="xl"
            title={`Send a message as ${webhook.name}`}
            actionBarInput={
                <span className={cl("status", status && (status.ok ? "status-ok" : "status-error"))}>
                    {status?.text ?? (message.content || message.embeds.length ? problem : "")}
                </span>
            }
            actions={[
                { text: "Import JSON", variant: "secondary", onClick: () => setImportText(importText === null ? "" : null) },
                { text: "Copy JSON", variant: "secondary", onClick: () => copyWithToast(JSON.stringify(cleaned, null, 2), "Copied message JSON") },
                { text: sending ? "Sending" : "Send", variant: "primary", onClick: () => void send(), disabled: sending || !!problem }
            ]}
        >
            <div className={cl("columns")}>
                <div className={cl("editor")}>
                    {importText !== null && (
                        <div className={cl("import")}>
                            <Field label="Message JSON">
                                <TextArea value={importText} rows={6} placeholder='{"content": "Hello"}' onChange={(text: string) => setImportText(text)} />
                            </Field>
                            <Button size="small" variant="primary" disabled={!importText.trim()} onClick={applyImport}>Apply</Button>
                        </div>
                    )}
                    <div className={cl("row")}>
                        <Field label="Name">
                            <TextInput value={message.username ?? ""} maxLength={80} placeholder={webhook.name} onChange={(username: string) => update({ username })} />
                        </Field>
                        <Field label="Avatar URL">
                            <TextInput value={message.avatar_url ?? ""} onChange={(avatar_url: string) => update({ avatar_url })} />
                        </Field>
                    </div>

                    <Field label={`Message (${message.content?.length ?? 0}/${MAX_CONTENT})`}>
                        <TextArea value={message.content ?? ""} rows={5} maxLength={MAX_CONTENT} onChange={(content: string) => update({ content })} />
                    </Field>

                    {message.embeds.map((embed, i) => (
                        <EmbedEditor
                            key={i}
                            embed={embed}
                            index={i}
                            onChange={next => update({ embeds: message.embeds.map((e, j) => j === i ? next : e) })}
                            onRemove={() => update({ embeds: message.embeds.filter((_, j) => j !== i) })}
                        />
                    ))}

                    {message.embeds.length < MAX_EMBEDS && (
                        <Button size="small" variant="secondary" onClick={() => update({ embeds: [...message.embeds, {}] })}>
                            Add embed
                        </Button>
                    )}
                </div>

                <div className={cl("side")}>
                    <span className={cl("label")}>Preview</span>
                    <Preview webhook={webhook} message={message} />
                </div>
            </div>
        </Modal>
    );
}

export function openComposer(webhook: Webhook) {
    openModal(props => (
        <ErrorBoundary noop onError={props.onClose}>
            <Composer webhook={webhook} modalProps={props} />
        </ErrorBoundary>
    ));
}
