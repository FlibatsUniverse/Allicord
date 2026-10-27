/*
 * SPDX-License-Identifier: GPL-3.0
 * Vencord Installer, a cross platform gui/cli app for installing Vencord
 * Copyright (c) 2023 Vendicated and Vencord contributors
 */

package main

import (
	"allicordinstaller/buildinfo"
	"image/color"
)

const ReleaseUrl = "https://api.github.com/repos/FlibatsUniverse/Allicord/releases/latest"
const ReleaseUrlFallback = "https://api.github.com/repos/FlibatsUniverse/Allicord/releases/latest"
const InstallerReleaseUrl = "https://api.github.com/repos/FlibatsUniverse/Allicord/releases/latest"
const InstallerReleaseUrlFallback = "https://api.github.com/repos/FlibatsUniverse/Allicord/releases/latest"

var UserAgent = "AllicordInstaller/" + buildinfo.InstallerGitHash + " (https://github.com/FlibatsUniverse/Allicord)"

const SupportUrl = "https://github.com/FlibatsUniverse/Allicord/issues"

var (
	AllicordBackground   = color.RGBA{0x0a, 0x0a, 0x0f, 0xff}
	AllicordCard         = color.RGBA{0x10, 0x10, 0x18, 0xff}
	AllicordBorder       = color.RGBA{0x20, 0x20, 0x28, 0xff}
	AllicordText         = color.RGBA{0xe6, 0xdf, 0xd3, 0xff}
	AllicordMuted        = color.RGBA{0xa1, 0xa1, 0xb4, 0xff}
	AllicordBrand        = color.RGBA{0xca, 0xa7, 0xf5, 0xff}
	AllicordBrandHovered = color.RGBA{0xb8, 0x89, 0xe8, 0xff}
	AllicordSurface      = color.RGBA{0x18, 0x18, 0x22, 0xff}
	AllicordSurfaceHover = color.RGBA{0x23, 0x23, 0x2f, 0xff}
	AllicordDanger       = color.RGBA{0x7a, 0x2a, 0x35, 0xff}
	AllicordDangerHover  = color.RGBA{0xa2, 0x35, 0x44, 0xff}
	AllicordErrorCard    = color.RGBA{0x4a, 0x1d, 0x26, 0xff}
)

var LinuxDiscordNames = []string{
	"Discord",
	"DiscordPTB",
	"DiscordCanary",
	"DiscordDevelopment",
	"discord",
	"discordptb",
	"discordcanary",
	"discorddevelopment",
	"discord-ptb",
	"discord-canary",
	"discord-development",
	// Flatpak
	"com.discordapp.Discord",
	"com.discordapp.DiscordPTB",
	"com.discordapp.DiscordCanary",
	"com.discordapp.DiscordDevelopment",
}
