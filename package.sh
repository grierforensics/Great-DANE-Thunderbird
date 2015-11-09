#!/bin/sh
mkdir build
zip -r build/greatdane.xpi * --exclude .git/\* --exclude .idea/\* --exclude build/\*
