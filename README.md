# Super Bug Zapper 3D
#### A 3D version of [Super Bug Zapper](https://github.com/brianzhouzc/Super-Bug-Zapper), a mini game created with WebGL, for the COSC 414 Computer Graphics course
![Screenshot](https://github.com/brianzhouzc/Super-Bug-Zapper_3D/blob/main/screenshot.png)

| Features:                                                                                                                                                                                       |                    |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------|
| The playing field starts as surface of a sphere centered at the origin.                                                                                                                         | :heavy_check_mark: |
| The player can drag the sphere to rotate to look for bacteria (under interactive control).                                                                                                      | :heavy_check_mark: |
| Bacteria grow on the surface of the sphere starting at an arbitrary spot on the surface and growing out uniformly in all directions from that spot at a speed determined by the game.           | :heavy_check_mark: |
| The player needs to eradicate the bacteria by placing the mouse over the bacteria and hitting a button.                                                                                         | :heavy_check_mark: |
| The effect of the poison administered is to immediately remove the poisoned bacteria.                                                                                                           | :heavy_check_mark: |
| The game can randomly generate up to a fixed number (say 10) of different bacteria (each with a different color).                                                                               | :heavy_check_mark: |
| The bacteria appear as a colored circular patch on the surface of the sphere.                                                                                                                   | :heavy_check_mark: |
| The game gains points through the delays in the user responding and by any specific bacteria reaching a threshold (for example, a diameter of a 30-degree arc on a great circle of the sphere). | :heavy_check_mark: |
| The player wins if all bacteria are poisoned before any two different bacteria reach the threshold mentioned above.                                                                             | :heavy_check_mark: |

| Bonus Features:                                                                                                                                                                                 |                    |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------|
| When two bacteria cultures collide, the first one to appear on the surface dominates and consumes the later generated bacteria.                                                                 | :heavy_check_mark: |
| When a bacterial culture is hit, use a simple 2D particle system to simulate an explosion at the point where the poison is administered.                                                        | :heavy_check_mark: |
