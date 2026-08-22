#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define SIZE 5
#define SHIPS 3

char board[SIZE][SIZE];    // actual board with ships
char display[SIZE][SIZE];  // what the player sees

void initBoards() {
    for (int i = 0; i < SIZE; i++)
        for (int j = 0; j < SIZE; j++) {
            board[i][j] = '~';
            display[i][j] = '~';
        }
}

void placeShips() {
    int count = 0;
    srand(time(0));
    while (count < SHIPS) {
        int r = rand() % SIZE;
        int c = rand() % SIZE;
        if (board[r][c] != 'S') {
            board[r][c] = 'S';
            count++;
        }
    }
}

void printDisplay() {
    printf("\n  ");
    for (int j = 0; j < SIZE; j++) printf("%d ", j);
    printf("\n");
    for (int i = 0; i < SIZE; i++) {
        printf("%d ", i);
        for (int j = 0; j < SIZE; j++)
            printf("%c ", display[i][j]);
        printf("\n");
    }
}

int main() {
    int r, c, hits = 0;
    initBoards();
    placeShips();

    printf("=== BATTLESHIP ===\n");
    printf("Sink all %d ships!\n", SHIPS);

    while (hits < SHIPS) {
        printDisplay();
        printf("\nEnter row and column to attack: ");
        scanf("%d %d", &r, &c);

        if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
            printf("Invalid position!\n");
            continue;
        }

        if (display[r][c] != '~') {
            printf("Already attacked here!\n");
            continue;
        }

        if (board[r][c] == 'S') {
            printf("HIT!\n");
            display[r][c] = 'X';
            hits++;
        } else {
            printf("MISS!\n");
            display[r][c] = 'O';
        }
    }

    printf("\nCongratulations! You sunk all ships!\n");
    printDisplay();

    return 0;
}
