#!/bin/sh

BASH_RC=/home/oracle/.bashrc
SCRIPTS=/scripts

source ${BASH_RC}

echo "$0: STOP LISTENER"
lsnrctl stop
echo "$0: DONE"

if [ -d "${SCRIPTS}" ]; then
    echo "$0: Executing user defined scripts"
    for f in ${SCRIPTS}/*; do
        case "${f}" in
            *.sh)
                echo "$0: running ${f}"
                . "${f}"
                ;;
            *.sql)
                echo "$0: running ${f}"
                echo "exit" | sqlplus -s "/ as sysdba" @"${f}"
                ;;
            *)
                echo "$0: ignoring ${f}"
                ;;
        esac
    done
fi

echo "$0: START LISTENER"
lsnrctl start
echo "$0: DONE"
