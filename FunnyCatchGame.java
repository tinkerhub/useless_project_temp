package space;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.util.ArrayList;
import java.util.Random;

public class FunnyCatchGame extends JPanel implements ActionListener {
    private Timer timer;
    private ArrayList<Item> items;
    private int playerX = 250;
    private final int playerWidth = 70;
    private final int playerHeight = 20;
    private int score = 0;

    public FunnyCatchGame() {
        timer = new Timer(20, this);
        items = new ArrayList<>();
        setFocusable(true);
        addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                if (e.getKeyCode() == KeyEvent.VK_LEFT) {
                    playerX -= 10;
                } else if (e.getKeyCode() == KeyEvent.VK_RIGHT) {
                    playerX += 10;
                }
                playerX = Math.max(0, Math.min(playerX, 500 - playerWidth));
            }
        });
        timer.start();
        spawnItems();
    }

    private void spawnItems() {
        Timer itemTimer = new Timer(1000, e -> {
            Random rand = new Random();
            int x = rand.nextInt(850);
            String itemType = rand.nextBoolean() ? "🦆" : "🌮"; 
            items.add(new Item(x, 0, itemType));
        });
        itemTimer.start();
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        g.setColor(Color.GREEN);
        g.fillRect(playerX, 450, playerWidth, playerHeight);
        g.setColor(Color.RED);
        for (Item item : items) {
            g.drawString(item.type, item.x, item.y);
        }
        g.setFont(new Font("Arial", Font.BOLD, 20));
        g.drawString("Score: " + score, 10, 20);
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        for (int i = 0; i < items.size(); i++) {
            Item item = items.get(i);
            item.y += 5; // Fall speed
            if (item.y > 500) {
                items.remove(i);
                i--;
            } else if (item.y >= 450 && item.x >= playerX && item.x <= playerX + playerWidth) {
                // Catching the item
                score += item.type.equals("🦆") ? 1 : 2; // Duck = 1 point, Taco = 2 points
                items.remove(i);
                i--;
            }
        }
        repaint();
    }

    public static void main(String[] args) {
        JFrame frame = new JFrame("Funny Catch Game");
        FunnyCatchGame game = new FunnyCatchGame();
        frame.add(game);
        frame.setSize(500, 500);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setVisible(true);
    }

    class Item {
        int x, y;
        String type;

        Item(int x, int y, String type) {
            this.x = x;
            this.y = y;
            this.type = type;
        }
    }
}
