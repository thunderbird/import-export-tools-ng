# ImportExportTools NG Changelog

## Versions

Version 14.1.6 : Multiple Folders Release - March 10, 2025

- New: Multiple folder selection exports
- More error handling for EML imports, mbox exports

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

Version 12.0.4 : Maintenance Release - June 24, 2023

- Fix search and export failure #412, #414, #418

Version 12.0.3 : Maintenance Release - June 1, 2023

- Fix virtual folder exports #359
- Fix encoding for attachment names #355
- Fix bad filename token in pl locale #366
- Fix PDF exception #369
- Fix bad filename token in pt-PT locale #398
- Improved ja locale additions #281
- Improved ru locale additions PR #401

Version 12.0.2 : Maintenance Release - October 24, 2022

- Fix PDF export on OSX! #353
- Fix PDF export on Linux 102.* #351
- Fix account level export folders #296
- Fix From: first line removal #350
- Fix escape characters for attachment names #339
- Add experimental folder column to cvs export #349
  Set advanced preference to true:
  extensions.importexporttoolsng.experimental.csv.account_folder_col


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

Version 10.0.1 : Maintenance Release - October 14, 2020

Bug Issues Fixed:
- #163, #158, #153 Fixed UTF-8 conversion for plaintext/csv
- #161 Fix CSV date format

Notables:
- Add better header err detection, debug output
- Allow index date format for CSV

Known Issues:
- Backup not working in 78


Version 10.0.0 : New Features - September 26, 2020

- New locales: el
- Index custom date format
- new tokens for filenames : sender/recipient e-mail
- Use `%d` in print settings header/footer for custom date

Bug Issues Fixed:
- #118, #63 Fixed conversion for plaintext
- #57 Use ForceDBClose to Close open files (fixes folders and messages)
- #77 Use global settings for PDF
- #130 scheduled backups
- #134 Correctly handle read, forwarded, replied flags

Thanks to many! : See issues


Version 4.1.0 : New Features - April 1, 2020

- Help/User guide : Fully localized
- Suffix option for filenames
- Custom date option for filenames allowing strftime() like full date and time formatting
- Use custom file naming for both attachments and embedded attachments
- Custom date option for index filenames
- Option to use 'Received Date' for filename and index
- User configurable Hotkeys (Keyboard shortcuts)
- PDF output now uses the global print options
- Improved HTML index file layout

Bug Issues Fixed:
- #68 fix for index attachment flag
- #74 fix for in-line image attachments not exported
- Fix #56 handle cancel on import dialog
- #77 use preferences for PDF output
- UI cleanup tweaks (#80, #81, #82 ) OS variations - @ovari
- German translation fix #93 - @dipgithub
- Hungarian translation fixes - @ovari
- Add missing license file #96 

Thanks to the following users for enhancement suggestions and test help, contributions:
@ovari
@dipgithub
@artofit
@JF1313
@jessejmorrow
@spd2000 
@kanlukasz 
@razzmatazzz 
@triplee

4.0.4 Maintenance  Release - September 16, 2019 
- Fixed text formatter signature change
- Fixed handling of import filenames > 55 characters

4.0.3 Maintenance  Release - September 12, 2019 
- Fixed EML import issue
- Fixed HTML layout for text attachments

4.0.2 Maintenance  Release - September 10, 2019 
- Fixed plaintext/HTML attachment export
  String.trim test failing - String generics deprecated
  Fixes #13
- Remove remaining Components.*
- Fix HTML export format for embedded images
  Change file pointer fixup 
  Move image into fieldset

4.0.1 Maintenance  Release - August 15, 2019 
 - Fixed warning for deprecated menu overlay task popup
   Fixes #9 
 - Use createXULElement for TB68+
   Fixes #8 , TB69 Beta compatibility

4.0.0  Initial NG Release - July 19, 2019 
 - Updated for TB68
 - New name and icon
 - Updated formatting
 - Options dialog tweaks, icon

## Original Extension:

3.3.2  Update for TB60 - January 27, 2019
 - Last version update by "Kaosmos"
