#!/bin/sh

SCRIPTS=/scripts

[ -f '/data/data.db' ] && exit

if [ -d "${SCRIPTS}" ]; then
    echo "$0: Executing user defined scripts"
    for f in ${SCRIPTS}/*; do
        case "${f}" in
            *.sql)
                echo "$0: running ${f}"
                cat "${f}" | sqlite3 /data/data.db
                ;;
            *)
                echo "$0: ignoring ${f}"
                ;;
        esac
    done
fi
