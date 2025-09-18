#!/usr/bin/env python3

# This file is provided by the webext-support repository at
# https://github.com/thunderbird/webext-support
#
# Version: 1.1
#
# Author: John Bieling (john@thunderbird.net), gNeander
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os, sys, json, re, io, shlex

#------------------------------------------------

def newDir(dir):
    if not os.path.exists(dir):
       print("Directory doesn't exist. Creating. <" +  dir + ">")
       os.makedirs(dir)

def convert(source, destination, current = None, level = 0):
    dir = source if current == None else current
    messages = []
    
    for name in os.listdir(dir):
        path = os.path.join(dir, name)
        
        if os.path.isfile(path):
            #if path.endswith('autobackup.dtd'):
             #   messages.extend(convert_dtd(path, dir))
            if path.endswith('hdrs.properties'):
                messages.extend(convert_prop(path, dir))

        else:
            messages.extend(convert(source, destination, path, level+1))

    if level > 1:
            return messages
    elif level == 1 and messages:
        # map the path from the source into the destination folder
        dest = dir.replace(source, destination);
        messagesjson = os.path.join(dest, "messages.json")
        newDir(dest)

        # check if the messagesjson already exists
        oldData = None
        if os.path.exists(messagesjson):
            with open(messagesjson, "r",  encoding='utf-8') as f:
                oldData = json.load(f)

        # merge data
        newData = json.loads("{" + ", ".join(messages) + "}")
        if oldData:
            mergedData = oldData
            mergedData.update(newData)
        else:
            mergedData = newData
        
        # write pretty printed json file
        final = json.dumps(mergedData, indent=4, sort_keys=True, ensure_ascii=False)
        with io.open(messagesjson, "w", encoding='utf-8') as f:
            f.write(final)

        # check the file for correctness
        print(" -> TESTING " + messagesjson)
        with open(messagesjson, "r",  encoding='utf-8') as f:
            d = json.load(f)
            #print(d)
    
    return []



def convert_dtd(path, dir):
    print(" CONVERTING <" + path + "> to JSON")

    sdtd = []

    dtd = io.open(path, 'r', encoding='utf-8')   
    dtdTokens = shlex.split(dtd.read(), posix=False)

    for i, j in enumerate(dtdTokens):
        if j == "<!ENTITY":
            sdtd.append(' "' + dtdTokens[i+1].strip() +'" : ' + json.dumps({ "message" : dtdTokens[i+2].strip()[1:-1] }))

    return sdtd


def convert_prop(path, dir):
    print(" CONVERTING <" + path + "> to JSON")

    sprop = []
    prop = io.open(path, 'r', encoding='utf-8')
    propLines = prop.readlines()

    for line in propLines:
        sline = line.strip().replace('\r','').replace('\n','')
        #print("next line >>" + line + "<<")

        if sline != '' and sline[0] != '#':
            a = sline.split('=')
            
            # search for %S and replace them by $P1$, $P2" and so on
            count = 0;
            placeholders = {};
            while True:
                idx = a[1].find("%S")
                if (idx == -1):
                    break
                count += 1
                a[1] = a[1].replace("%S", "$P" + str(count) + "$", 1)
                placeholders["P" + str(count)] = { "content" : "$" + str(count) }
            
            data = {}
            #data["src"] = "mboximport";
            data["message"] = a[1].strip();
            if len(placeholders) > 0:
                data["placeholders"] = placeholders
                 
            sprop.append(' "' + a[0].strip() +'" : ' +  json.dumps(data));

    return sprop


if __name__ == "__main__":

    print ("""
      This python3 script converts legacy locale files (*.properties and *.dtd)
      to the new WebExt JSON format.""")

    if (len(sys.argv) < 2 or len(sys.argv) > 3):
        print ("""
      Legacy                              WebExt
      ------                              ------
       locale                              _locales
         |__ <languageX>                      |__ <languageX>
               |__ <myaddon.dtd>                    |__ <messages.json>
               |__ <myaddon.properties>


      Usage:
        py locale-converter.py <source> [<destination>] 
        
        If the destination folder (WebExt _locales folder) is not specified,
        the specified source folder (legacy locale folder) will be used as
        the destination folder.
        
        If there is an existing messages.json at the final destination, the
        script will attempt to merge the new strings into it.
        
      Testing:
        Each created JSON file is tested with the python function json.load(f),
        which will throw an error in case something went wrong. Run a JSON
        validator on the created json files to learn more about the error.
        
      JSON Validators:
        https://jsonlint.com/
        http://jsoneditoronline.org/
        https://jsonformatter.curiousconcept.com/
        """)

        exit()
   
    # use source as destination, if not specified
    source = sys.argv[1];
    destination = sys.argv[1];
    if (len(sys.argv) == 3):
        destination = sys.argv[2];
        
    convert(source, destination)

    print( """Done""")