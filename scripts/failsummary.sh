#!/bin/sh
# Prints a compact list of failing generator tests.
node --test tests/ 2>&1 | awk '/^✖ failing tests/{f=1} f' | grep -A4 "^✖" | grep -v "^--$\|^test at\|^$" | cut -c1-330
node --test tests/ 2>&1 | grep "^ℹ \(pass\|fail\)"
