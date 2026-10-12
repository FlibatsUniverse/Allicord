/*
 * SPDX-License-Identifier: GPL-3.0
 * Vencord Installer, a cross platform gui/cli app for installing Vencord
 * Copyright (c) 2023 Vendicated and Vencord contributors
 */

package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	path "path/filepath"
	"regexp"
	"strings"
)

type GithubRelease struct {
	Name    string `json:"name"`
	TagName string `json:"tag_name"`
	Assets  []struct {
		Name        string `json:"name"`
		DownloadURL string `json:"browser_download_url"`
	} `json:"assets"`
}

var ReleaseData GithubRelease
var GithubError error
var GithubDoneChan chan bool

var InstalledHash = "None"
var LatestHash = "Unknown"
var IsDevInstall bool

func GetGithubRelease(url, fallbackUrl string) (*GithubRelease, error) {
	Log.Debug("Fetching", url)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		Log.Error("Failed to create Request", err)
		return nil, err
	}

	req.Header.Set("User-Agent", UserAgent)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		Log.Error("Failed to send Request", err)
		return nil, err
	}

	defer res.Body.Close()

	if res.StatusCode >= 300 {
		isRateLimitedOrBlocked := res.StatusCode == 401 || res.StatusCode == 403 || res.StatusCode == 429
		triedFallback := url == fallbackUrl

		if isRateLimitedOrBlocked && !triedFallback {
			Log.Error(fmt.Sprintf("Failed to fetch %s (status code %d). Trying fallback url %s", url, res.StatusCode, fallbackUrl))
			return GetGithubRelease(fallbackUrl, fallbackUrl)
		}

		err = errors.New(res.Status)
		Log.Error(url, "returned Non-OK status", GithubError)
		return nil, err
	}

	var data GithubRelease

	if err = json.NewDecoder(res.Body).Decode(&data); err != nil {
		Log.Error("Failed to decode GitHub JSON Response", err)
		return nil, err
	}

	return &data, nil
}

func InitGithubDownloader() {
	GithubDoneChan = make(chan bool, 1)

	IsDevInstall = os.Getenv("EQUICORD_DEV_INSTALL") == "1"
	Log.Debug("Is Dev Install: ", IsDevInstall)
	if IsDevInstall {
		GithubDoneChan <- true
		return
	}

	go func() {
		// Make sure UI updates once the request either finished or failed
		defer func() {
			GithubDoneChan <- GithubError == nil
		}()

		data, err := GetGithubRelease(ReleaseUrl, ReleaseUrlFallback)
		if err != nil {
			GithubError = err
			return
		}

		ReleaseData = *data

		i := strings.LastIndex(data.Name, " ") + 1
		LatestHash = data.Name[i:]
		Log.Debug("Finished fetching GitHub Data")
		Log.Debug("Latest hash is", LatestHash, "Local Install is", Ternary(LatestHash == InstalledHash, "up to date!", "outdated!"))
	}()

	// either .asar file or directory with main.js file (in DEV)
	EquicordFile := EquicordDirectory

	stat, err := os.Stat(EquicordFile)
	if err != nil {
		return
	}

	// dev
	if stat.IsDir() {
		EquicordFile = path.Join(EquicordFile, "main.js")
	}

	// Check hash of installed version if exists
	b, err := os.ReadFile(EquicordFile)
	if err != nil {
		return
	}

	Log.Debug("Found existing Equicord Install. Checking for hash...")

	re := regexp.MustCompile(`// Allicord by Alliance (\w+)`)
	match := re.FindSubmatch(b)
	if match != nil {
		InstalledHash = string(match[1])
		Log.Debug("Existing hash is", InstalledHash)

	} else {
		Log.Debug("Didn't find hash")

	}
}

func installLatestBuilds() error {
	if IsDevInstall {
		return nil
	}
	const assetName = "Allicord-desktop.asar"
	downloadURL, checksumsURL := "", ""
	for _, asset := range ReleaseData.Assets {
		if asset.Name == assetName {
			downloadURL = asset.DownloadURL
		}
		if asset.Name == "SHA256SUMS" {
			checksumsURL = asset.DownloadURL
		}
	}
	if downloadURL == "" || checksumsURL == "" {
		return errors.New("Allicord release is missing its client or SHA256SUMS")
	}
	sums, err := http.Get(checksumsURL)
	if err != nil {
		return err
	}
	defer sums.Body.Close()
	if sums.StatusCode != http.StatusOK {
		return fmt.Errorf("Checksums download failed: %s", sums.Status)
	}
	checksumData, err := io.ReadAll(io.LimitReader(sums.Body, 1024*1024))
	if err != nil {
		return err
	}
	expected := ""
	for _, line := range strings.Split(string(checksumData), "\n") {
		fields := strings.Fields(line)
		if len(fields) == 2 && strings.TrimPrefix(fields[1], "*") == assetName {
			expected = fields[0]
		}
	}
	if len(expected) != 64 {
		return errors.New("Allicord client checksum is missing or invalid")
	}
	response, err := http.Get(downloadURL)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("Client download failed: %s", response.Status)
	}
	temp, err := os.CreateTemp(path.Dir(EquicordDirectory), "allicord-*.asar")
	if err != nil {
		return err
	}
	defer os.Remove(temp.Name())
	hash := sha256.New()
	_, copyErr := io.Copy(io.MultiWriter(temp, hash), response.Body)
	closeErr := temp.Close()
	if copyErr != nil {
		return copyErr
	}
	if closeErr != nil {
		return closeErr
	}
	if hex.EncodeToString(hash.Sum(nil)) != expected {
		return errors.New("Allicord client SHA-256 verification failed")
	}
	if err := os.Chmod(temp.Name(), 0644); err != nil {
		return err
	}
	if err := os.Rename(temp.Name(), EquicordDirectory); err != nil {
		return err
	}
	_ = FixOwnership(EquicordDirectory)
	InstalledHash = LatestHash
	return nil
}
