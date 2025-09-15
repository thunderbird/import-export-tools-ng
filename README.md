# ![IETng icon] Import Export Tools NG


[ImportExportTools NG](https://addons.thunderbird.net/addon/importexporttools-ng/) adds import and 
export functions for messages, folders and profiles.

[Click here to view this add-on’s version history](https://addons.thunderbird.net/addon/importexporttools-ng/versions/).

[![TB78](https://raster.shields.io/badge/version-v12.0.4%20(released%20version)-darkgreen.png?label=Thunderbird%20102)](https://addons.thunderbird.net/addon/importexporttools-ng/)
[![TB91](https://raster.shields.io/badge/version-v14.1.14%20(released%20version)-C70039.png?label=Thunderbird%20v140-v144)](https://github.com/thundernest/import-export-tools-ng/issues/264)
[![License: GPL 3.0](https://img.shields.io/badge/License-GPL%203.0-red.png)](https://opensource.org/licenses/GPL-3.0)

## New Wiki 

- Notes, help and utility scripts (WIP)
- [Apple mail conversion help](https://github.com/thundernest/import-export-tools-ng/wiki) - @obar

## Import Export Tools NG Add-On Features - Version Notes

Version 14.1.14 : Maintenance Release - September 16, 2025

- Fix race condition preventing auto backup on shutdown 

Version 14.1.13 : v140-v144 Release - September 8, 2025

- Compatibility for v140-v144
- Convert and remove last properties files

Version 14.1.12 : v140-v142 Release - August 21, 2025

- Use conditional for prettyName and localizedName 
 to support v140 & v141+
 - Compatibility for v142
 
Version 14.1.5 : Maintenance Release - February 3, 2025

- Rollback mboxImportExport module to stable v7
- Remove date from custom backup folder name
- Update Chinese (zh-CN) locale - @ziqin

Version 14.1.4 : Maintenance Release - January 13 2025

- New: Backup option for number of backups to retain #302, #663
		- New: Support Unicode characters in plaintext exports #639
		- Fix CSV export in search dialog #646
		- Fix EML import/export issues #631
		- Add note to mbox import menu help, only valid for Local Folders, not IMAP
		- Fix mbox file exports to use LF line endings #607
		
Version 14.1.2 : Maintenance Release - July,22 2024

- Fix search-export for HTML and Plaintext 
- Add reply-to translations
- fix Thunderbird headers for ja locale


Version 14.1.0 : Thunderbird v128 Support - July,15 2024

- New: Thunderbird v128 and v115 support
- New: Filters and transforms for filenames in UI
- Fix missing UTF-8 conversion for HTML and Plaintext exports #581
- Fix ja and zn-CH indexes #588
- Fix To, From and ReplyTo fields in HTML and Plaintext exports #586
- Fix message export date option #585
- Fix LF conversion for Windows plaintext #584
- Fix illegal filename character filter #576

Version 14.0.3 : Maintenance Release - June,6 2024

- Promisify and fix export messages timing issue #568
- New: Latinize filenames transform. Use boolean preference:
  extensions.importexporttoolsng.export.filename_latinize
- New: UTF-16 filenames filter (emojis, symbols…). Use boolean preference:
  extensions.importexporttoolsng.export.filename_filterUTF16
- New: Character filter for filenames. Use UTF-16 string preference:
  extensions.importexporttoolsng.export.filename_filter_characters
  Enter the characters with no separators

Version 14.0.2 : Subfolders Release - April 10, 2024

- New: Recursive Subfolder Export for EML, HTML, PDF and Plaintext #538
- New: Size column in index #508
- New: Import OSX 9- CR terminations mbox files #540
- New: Support shortcuts for ExportSelectedMessages #519
- New: Czech (cs) locale - @cewbdex
- Fix mbox From_ separator to use asctime() date format #537
- Fix PDF exports do not use Mozilla Save toPDF settings #528
- Fix Right-clicking folder doesn't show export mbox option for Maildir #525
- Fix Cannot import emails with linebreaks in Return-Path header #516
- Fix Export all messages of a virtual folder to html with attachments and index - missing messages folder #509
- Fix context menu for message window #505
- Convert dtd files to messages.json

Version 14.0.1 : Maintenance Release - November 10, 2023

- New: Add Account level mbox import
- New: Add Account level mbox flattened export
- New: Support for mbox import and export to filesys levels
- Fix CSV export to text #451, #463
- Fix export folder to ZIP
- Fix help load only on IETNG updates
- Add preference to never load help on updates #458
  extensions.importexporttoolsng.export.help.showOnInstallAndUpdate
- Fix help for sublocales and unsupported locales
- Fix mbox From_ separators to adhere to RFC 4155 #455
- Add back Export Messages in message display windows #459
- Fix Account export for pop3
- Fix buffer boundary From_ escaping
- Fix selected messages handling #485
- Complete de locale update @Mr-Update
- Complete fr locale update @DenB10
- Complete da locale update @Joergen
- Updated ja locale @kiki-ja

Version 14.0.0 : Thunderbird v115 Support - September 26, 2023

- Thunderbird v115 ESR support
- New UI refresh
- New Dark mode support
- New clean, consistent and logical menus
- New toolbar button for profile, backup and options support
- New .mbox extension option for non-structured exports
- New strip CR from eml exports
- Improved mbox From_ escaping


Version 10.0.2 : Maintenance Release - November 14, 2020

Bug Issues Fixed:

- #140 Handle right click on unselected folder
- #149 EML import fixes
- #154 Backup does not run if File/Exit used
- #157, #159 Backups failing
- #173 Handle no selected folder
- #174 Sender_email & recipient_email  tokens missing for  attachments
- #175 Support comma and single quote in filenames

Notables:

- Added Backup on exit option
- Use `Index, CSV Date Format` option for full custom format (options Misc tab)


Thanks to many! : See issues

# Features

Menus:
 - Tools (most import and export functions including profiles)
 - Folders (most import and export functions)
 - Search dialog (export search results)
 - Selected messages (export or copy to clipboard)

Export:
 - Individual folder(s), optionally including subfolders (mbox format)
 - All folder messages in the following formats:
   - EML, HTML, PDF, CSV or plaintext
   - Export as individual files or a single file
   - Optionally include attachments
   - Export indexes as plain text or CSV
   - Extensive file naming convention options
   - Export messages from search dialog

Import:
 - Mbox files (including structure)
 - EML & EMLX files
 - Individual or all directory files

Profiles:
 - Export complete profile or just the mail files
 - Import profile
 - Auto profile backup with schedule on shutdown

SMS: Will be deprecated!

## Import Export Tools NG Add-On Installation

Normal install (requires Internet access) from [Thunderbird Add-on site](https://addons.thunderbird.net/):
- Download and install [ATN version](https://addons.thunderbird.net/addon/ImportExportToolsNG/) via the ``Add-ons Manager``.
- From the [Thunderbird Menu Bar](https://support.mozilla.org/en-US/kb/display-thunderbird-menus-and-toolbar), select ``Tools`` then ``Add-ons`` to open the ``Add-ons Manager``. Choose the ``Extensions`` tab, search for “TBD”, select ``+ Add to Thunderbird`` and follow the prompts to install and then restart.

Install (with or without Internet access) XPI directly:
- Download and install [GitHub XPI version](xpi) via the ``Add-ons Manager``.
- From the [Thunderbird Menu Bar](https://support.mozilla.org/en-US/kb/display-thunderbird-menus-and-toolbar), select ``Tools`` then ``Add-ons`` to open the ``Add-ons Manager``. Choose the ``Extensions`` tab, click the gear icon and choose ``Install Add-on From File…``
- Choose [XPI file](xpi), install and restart.

## Brief Usage Instructions

The extension adds a new menu item in the Tools menu.
(You may have to enable the Menu Bar from Preferences to make it display. Depending on the version of Thunderbird, the option to show the menu bar may be under "View" or "Customize" instead.)
The new submenu displays a number of additional actions which you can peform
to import or export various types of information into and out of Thunderbird.

The original add-on (link above) has a number of notes about individual commands,
though no structured user guide or handbook yet. (Sorry.)

## XPI Add-on Package Build instructions

Visual Studio Code:
 Build Default Task

Basic Command Line Build: (requires 7zip CLI version)
7z a ./xpi/import-export-tools-ng-4.0.0-tb.xpi ./src/*

## Issues & Questions
Post any issues or questions for Import Export Tools under [Issues](https://github.com/thundernest/import-export-tools-ng/issues)

## Changelog
 ImportExportTools NG changes are logged [here](CHANGELOG.md).

## Credits
Original Author: [Paolo “Kaosmos”](https://addons.thunderbird.net/user/Paolo_Kaosmos/)  
Developing Author: [Christopher Leidigh](https://github.com/cleidigh/)  

<html>
<div>Extension Icon: <a href="https://www.flaticon.com/authors/pixel-perfect" title="Pixel perfect">Pixel perfect</a> from <a href="https://www.flaticon.com/"                 title="Flaticon">www.flaticon.com & cleidigh</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/"                 title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>
</html>

[IETng icon]: rep-resources/images/import-export-tools-ng-icon-64px.png 
