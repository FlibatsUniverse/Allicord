/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestAllicordReleaseEndpoints(t *testing.T) {
	for _, endpoint := range []string{ReleaseUrl, ReleaseUrlFallback, InstallerReleaseUrl, InstallerReleaseUrlFallback, GetInstallerDownloadLink()} {
		if !strings.Contains(endpoint, "/FlibatsUniverse/Allicord/") {
			t.Fatalf("Unexpected upstream endpoint: %s", endpoint)
		}
	}
	if !strings.Contains(GetInstallerDownloadLink(), "AllicordInstaller") {
		t.Fatal("Self updater selected another installer")
	}
}

func TestVerifiedClientDownload(t *testing.T) {
	originalDirectory, originalData, originalDev, originalHash := EquicordDirectory, ReleaseData, IsDevInstall, InstalledHash
	t.Cleanup(func() {
		EquicordDirectory, ReleaseData, IsDevInstall, InstalledHash = originalDirectory, originalData, originalDev, originalHash
	})
	for _, valid := range []bool{true, false} {
		t.Run(fmt.Sprintf("valid=%t", valid), func(t *testing.T) {
			payload := []byte("Allicord client fixture")
			digest := fmt.Sprintf("%x", sha256.Sum256(payload))
			if !valid {
				digest = strings.Repeat("0", 64)
			}
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/SHA256SUMS" {
					fmt.Fprintf(w, "%s  Allicord-desktop.asar\n", digest)
					return
				}
				w.Write(payload)
			}))
			defer server.Close()
			metadata := fmt.Sprintf(`{"assets":[{"name":"Allicord-desktop.asar","browser_download_url":"%s/client"},{"name":"SHA256SUMS","browser_download_url":"%s/SHA256SUMS"}]}`, server.URL, server.URL)
			if err := json.Unmarshal([]byte(metadata), &ReleaseData); err != nil {
				t.Fatal(err)
			}
			EquicordDirectory = filepath.Join(t.TempDir(), "client.asar")
			previous := []byte("previous installed client")
			if err := os.WriteFile(EquicordDirectory, previous, 0644); err != nil {
				t.Fatal(err)
			}
			IsDevInstall = false
			err := installLatestBuilds()
			if valid && err != nil {
				t.Fatal(err)
			}
			if !valid && err == nil {
				t.Fatal("Accepted an invalid checksum")
			}
			got, err := os.ReadFile(EquicordDirectory)
			if err != nil {
				t.Fatal(err)
			}
			want := previous
			if valid {
				want = payload
			}
			if !bytes.Equal(got, want) {
				t.Fatal("Client content was replaced incorrectly")
			}
		})
	}
}

func TestInstallAndUninstallFixture(t *testing.T) {
	directory := t.TempDir()
	app := filepath.Join(directory, "app.asar")
	original := []byte("original Discord fixture")
	if err := os.WriteFile(app, original, 0644); err != nil {
		t.Fatal(err)
	}
	if err := patchAppAsar(directory, false); err != nil {
		t.Fatal(err)
	}
	loader, err := os.ReadFile(app)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Contains(loader, []byte("require(")) {
		t.Fatal("Installer did not write a loader")
	}
	if err := unpatchAppAsar(directory, false); err != nil {
		t.Fatal(err)
	}
	restored, err := os.ReadFile(app)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(restored, original) {
		t.Fatal("Uninstall did not restore the original app")
	}
	if _, err := os.Stat(filepath.Join(directory, "_app.asar")); !os.IsNotExist(err) {
		t.Fatal("Uninstall left the backup behind")
	}
}

func TestDetectInstalledProduct(t *testing.T) {
	for _, product := range []string{"Equicord", "Allicord", "Vencord"} {
		t.Run(product, func(t *testing.T) {
			directory := t.TempDir()
			client := filepath.Join(directory, "equicord.asar")
			banner := "// " + product + " abc123\n"
			if product == "Allicord" {
				banner = "// Allicord by Alliance abc123\n"
			}
			payload := []byte(banner)
			header, err := json.Marshal(map[string]any{"files": map[string]any{"patcher.js": map[string]any{"size": len(payload), "offset": "0"}}})
			if err != nil {
				t.Fatal(err)
			}
			aligned := (len(header) + 3) &^ 3
			data := make([]byte, 16+aligned)
			binary.LittleEndian.PutUint32(data[0:4], 4)
			binary.LittleEndian.PutUint32(data[4:8], uint32(aligned+8))
			binary.LittleEndian.PutUint32(data[8:12], uint32(aligned+4))
			binary.LittleEndian.PutUint32(data[12:16], uint32(len(header)))
			copy(data[16:], header)
			if err := os.WriteFile(client, append(data, payload...), 0644); err != nil {
				t.Fatal(err)
			}
			loader := filepath.Join(directory, "app.asar")
			if err := WriteAppAsar(loader, client); err != nil {
				t.Fatal(err)
			}
			if got := detectInstalledProduct(loader); got != product {
				t.Fatalf("Detected %q, expected %q", got, product)
			}
			installation := DiscordInstall{isPatched: true, appPath: filepath.Join(directory, "app")}
			if label := installation.installedLabel(); label != product+" Installed" {
				t.Fatalf("Incorrect label: %s", label)
			}
		})
	}
}

func TestUnknownModificationIsNotAllicord(t *testing.T) {
	directory := t.TempDir()
	if err := os.WriteFile(filepath.Join(directory, "app.asar"), []byte("unrecognized patched client"), 0644); err != nil {
		t.Fatal(err)
	}
	installation := DiscordInstall{isPatched: true, appPath: filepath.Join(directory, "app")}
	if label := installation.installedLabel(); label != "Another client modification Installed" {
		t.Fatalf("Incorrect label: %s", label)
	}
}
