#!/usr/bin/env bash

function generate_help() {
    pandoc -t html5 -s -S README.md -H head.html > content/help.html
}

type pandoc && generate_help

zip -r greatdane.xpi chrome.manifest content skin defaults install.rdf modules README.md
