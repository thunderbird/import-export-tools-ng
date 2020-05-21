#!/usr/bin/env python3

# -*- coding: utf-8 -*-
# email/applembox2sbd.py
# Ori Barbut - 2020

"""A script to convert Apple Mail's export to a format suitable for Thunderbird's
ImportExportTools NG plugin.

This is an experimental script that should only be run on a copy of a mail export,
with proper backups in place, as no assurances are made that it will function correctly."""


import sys
import argparse
from pathlib import Path
import shutil

def AppleMailDir(instring):
    indir = Path(instring)
    if not indir.is_dir():
        raise argparse.ArgumentTypeError("Not a directory")
    elif not any(x.name.endswith('.mbox') for x in indir.iterdir()):
        raise argparse.ArgumentTypeError("Top level does not contain any .mbox folders. " \
            "Are you sure this is an Apple Mail export? " \
            "If you have run the script on this directory already, it has been converted.")
    else:
        return indir

def get_args():
    parser = argparse.ArgumentParser(description="Convert Apple Mail export to sbd directory structure for Thunderbird import. " \
        "Operation is in-place, so it is recommended that you BACK UP YOUR EXPORT DIR FIRST")
    parser.add_argument('indir', metavar='IN', type=AppleMailDir,
                        help="Path to the Apple Mail export")
    parser.add_argument('--verbose', '-v', dest='verbose', action='store_true',
                        help="Print operations to terminal")
    parser.add_argument('--dry-run', '-d', dest='dryrun', action='store_true',
                        help="Simulate operation, do not execute. Implies verbose output")
    args = parser.parse_args()

    if args.dryrun:
        args.verbose = True

    return args

def move_path(src, target, verbose, dryrun):
    if verbose:
        print("Move {} to {}".format(str(src), str(target)))
    if not dryrun:
        src.replace(target)

def delete_path(in_path, verbose, dryrun):
    if verbose:
        print("Delete {}".format(str(in_path)))
    if not dryrun:
        shutil.rmtree(str(in_path)) # Converting to string for older Python 3 versions

def is_mbox_dir(in_path):
    """Determines if a path is an mbox directory"""
    return in_path.is_dir() and in_path.name.endswith('.mbox')

def transform_directory(d, verbose, dryrun):
    """Recursively find [basename].mbox directories.
    If there are corresponding [basename] directories, rename them to [basename].sbd
    Move [basename].mbox/mbox to [basename]
    Remove the [basename].mbox directory as otherwise it pollutes the import with a
      blank folder (and the table_of_contents file in that directory is not useful)
    Recursively process the newly-renamed [basename].sbd directories."""
    for mbox_dir in filter(is_mbox_dir, d.iterdir()):
        basename = mbox_dir.name[:-5]
        # Operate on matching directory first, as it's name will be the eventual mbox file name
        basename_path = d.joinpath(basename)
        if basename_path.exists():
            if basename_path.is_dir():
                sbd_dir = Path(str(basename_path) + ".sbd")
                move_path(basename_path, sbd_dir, verbose, dryrun)
                if dryrun:
                    # For a dry run, we need to enter a different path
                    transform_directory(basename_path, verbose, dryrun)
                else:
                    transform_directory(sbd_dir, verbose, dryrun)
            else:
                # If there is no directory, that's not an issue. But if it exists,
                # it should be a directory.
                print("Expected {} as a directory, not a file".format(basename_path))
        mbox_file = mbox_dir.joinpath('mbox')
        if mbox_file.exists() and mbox_file.is_file():
            # This is a move one directory up and a rename to the basename
            move_path(mbox_file, basename_path, verbose, dryrun)
            delete_path(mbox_dir, verbose, dryrun)
        else:
            print("Expected to find file at {}".format(mbox_file))

def main():
    args = get_args()
    transform_directory(args.indir, args.verbose, args.dryrun)
    print("Finished")
    sys.exit(0)

main()
