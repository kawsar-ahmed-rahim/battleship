/*
 * battleship.c — Battleship game logic
 *
 * This is Rahim's original game logic (same 5x5 grid, same 3 randomly
 * placed single-cell ships, same hit/miss rules), split into two
 * commands instead of one interactive loop, because the server spawns
 * this program fresh for every request rather than keeping one
 * long-running process:
 *
 *   ./battleship start
 *       Places 3 ships randomly and prints the secret board plus a
 *       fresh, all-water display grid.
 *
 *   ./battleship attack <board25> <display25> <row> <col>
 *       Applies one attack to the given state and prints the updated
 *       display, hit count, and result.
 *
 * The secret board only ever lives on the server side (see server.js) —
 * this program just answers "given this board and this shot, what
 * happens next", the same way the original loop body did. Both grids
 * are passed around as flat 25-character strings (row-major, 5x5),
 * since command-line arguments are just plain strings.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>

#define SIZE 5
#define SHIPS 3
#define CELLS (SIZE * SIZE)

void place_ships(char *board) {
    for (int i = 0; i < CELLS; i++) board[i] = '~';

    srand((unsigned int)time(NULL) ^ (unsigned int)getpid());
    int count = 0;
    while (count < SHIPS) {
        int idx = rand() % CELLS;
        if (board[idx] != 'S') {
            board[idx] = 'S';
            count++;
        }
    }
}

void cmd_start(void) {
    char board[CELLS + 1];
    place_ships(board);
    board[CELLS] = '\0';

    char display[CELLS + 1];
    for (int i = 0; i < CELLS; i++) display[i] = '~';
    display[CELLS] = '\0';

    printf("BOARD:%s\n", board);
    printf("DISPLAY:%s\n", display);
    printf("HITS:0\n");
    printf("STATUS:playing\n");
}

/* Applies one attack using the exact same checks as the original loop:
   bounds check, already-attacked check, then hit or miss. */
void cmd_attack(const char *boardIn, const char *displayIn, int r, int c) {
    char board[CELLS + 1];
    char display[CELLS + 1];
    strncpy(board, boardIn, CELLS);
    board[CELLS] = '\0';
    strncpy(display, displayIn, CELLS);
    display[CELLS] = '\0';

    const char *result;

    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
        result = "invalid";
    } else {
        int idx = r * SIZE + c;
        if (display[idx] != '~') {
            result = "repeat";
        } else if (board[idx] == 'S') {
            display[idx] = 'X';
            result = "hit";
        } else {
            display[idx] = 'O';
            result = "miss";
        }
    }

    int hits = 0;
    for (int i = 0; i < CELLS; i++) {
        if (display[i] == 'X') hits++;
    }

    const char *status = (hits >= SHIPS) ? "win" : "playing";

    printf("BOARD:%s\n", board);
    printf("DISPLAY:%s\n", display);
    printf("HITS:%d\n", hits);
    printf("RESULT:%s\n", result);
    printf("STATUS:%s\n", status);
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage:\n  %s start\n  %s attack <board25> <display25> <row> <col>\n",
                argv[0], argv[0]);
        return 1;
    }

    if (strcmp(argv[1], "start") == 0) {
        cmd_start();
        return 0;
    }

    if (strcmp(argv[1], "attack") == 0) {
        if (argc != 6) {
            fprintf(stderr, "Usage: %s attack <board25> <display25> <row> <col>\n", argv[0]);
            return 1;
        }
        const char *board = argv[2];
        const char *display = argv[3];
        int r = atoi(argv[4]);
        int c = atoi(argv[5]);
        cmd_attack(board, display, r, c);
        return 0;
    }

    fprintf(stderr, "Unknown command: %s\n", argv[1]);
    return 1;
}
