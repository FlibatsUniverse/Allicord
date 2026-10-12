/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

package main

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

func readScriptPrefix(filename string) []byte {
	file, err := os.Open(filename)
	if err != nil {
		return nil
	}
	defer file.Close()
	data, _ := io.ReadAll(io.LimitReader(file, 16384))
	return data
}

func readAsarPrefix(filename, entry string) []byte {
	file, err := os.Open(filename)
	if err != nil {
		return nil
	}
	defer file.Close()
	prefix := make([]byte, 16)
	if _, err = io.ReadFull(file, prefix); err != nil {
		return nil
	}
	length := binary.LittleEndian.Uint32(prefix[12:16])
	if length == 0 || length > 8*1024*1024 {
		return nil
	}
	header := make([]byte, length)
	if _, err = io.ReadFull(file, header); err != nil {
		return nil
	}
	var archive struct {
		Files map[string]struct {
			Offset string
			Size   int64
		}
	}
	if json.Unmarshal(header, &archive) != nil {
		return nil
	}
	metadata, exists := archive.Files[entry]
	if !exists || metadata.Size <= 0 {
		return nil
	}
	offset, err := strconv.ParseInt(metadata.Offset, 10, 64)
	if err != nil || offset < 0 {
		return nil
	}
	size := metadata.Size
	if size > 16384 {
		size = 16384
	}
	data := make([]byte, size)
	position := int64(8) + int64(binary.LittleEndian.Uint32(prefix[4:8])) + offset
	if _, err = file.ReadAt(data, position); err != nil {
		return nil
	}
	return data
}

func detectInstalledProduct(loader string) string {
	script := readAsarPrefix(loader, "index.js")
	if info, err := os.Stat(loader); err == nil && info.IsDir() {
		script = readScriptPrefix(filepath.Join(loader, "index.js"))
	}
	match := regexp.MustCompile(`require\(("(?:\\.|[^"\\])*")\)`).FindSubmatch(script)
	if match == nil {
		return "Another client modification"
	}
	var target string
	if json.Unmarshal(match[1], &target) != nil {
		return "Another client modification"
	}
	if !filepath.IsAbs(target) {
		target = filepath.Join(filepath.Dir(loader), target)
	}
	var banner []byte
	if info, err := os.Stat(target); err == nil && info.IsDir() {
		for _, entry := range []string{"patcher.js", "main.js"} {
			banner = readScriptPrefix(filepath.Join(target, entry))
			if len(banner) > 0 {
				break
			}
		}
	} else if virtual := strings.Index(strings.ToLower(filepath.ToSlash(target)), ".asar/"); virtual >= 0 {
		banner = readAsarPrefix(target[:virtual+5], filepath.ToSlash(target[virtual+6:]))
	} else if strings.EqualFold(filepath.Ext(target), ".js") {
		banner = readScriptPrefix(target)
	} else {
		banner = readAsarPrefix(target, "patcher.js")
		if len(banner) == 0 {
			banner = readAsarPrefix(target, "main.js")
		}
	}
	for _, product := range []string{"Allicord", "Equicord", "Vencord"} {
		marker := "// " + product + " "
		if product == "Allicord" {
			marker = "// Allicord by Alliance "
		}
		if bytes.Contains(banner, []byte(marker)) {
			return product
		}
	}
	return "Another client modification"
}

func (di *DiscordInstall) installedLabel() string {
	if !di.isPatched {
		return ""
	}
	if di.installedProduct == "" {
		directory := filepath.Dir(di.appPath)
		if di.isSystemElectron {
			directory = di.path
		}
		loader := filepath.Join(directory, "app.asar")
		if info, err := os.Stat(filepath.Join(directory, "app", "index.js")); err == nil && !info.IsDir() {
			loader = filepath.Join(directory, "app")
		}
		di.installedProduct = detectInstalledProduct(loader)
	}
	return di.installedProduct + " Installed"
}
