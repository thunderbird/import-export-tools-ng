# ImportExportTools NG Changelog

## Versions

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
