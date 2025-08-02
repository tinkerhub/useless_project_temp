import tkinter as tk
from tkinter import messagebox
import threading
import time
import random
from plyer import notification
from pynput import keyboard

# --- Notification Content ---
useless_facts = [
    "A group of flamingos is called a flamboyance.",
    "Bananas are berries, but strawberries aren't.",
    "Octopuses have three hearts.",
    "The Eiffel Tower can grow taller in summer.",
    "Cows moo with regional accents.",
    "Mosquitoes are attracted to people who just ate bananas.",
    "If you lift a goldfish out of water, it forgets everything instantly.",
]

cringe_dialogues = [
    "Are you Google? Because you have everything I’ve been searching for.",
    "If beauty were time, you’d be eternity.",
    "I put the 'pro' in procrastination.",
    "You're so bright, even the sun wears shades.",
    "Are you a keyboard? Because you're just my type.",
]

roasts = [
    "Backspace won't fix your life choices.",
    "Trying to erase your failures with Backspace?",
    "You press backspace like it’ll delete your personality.",
    "Deleting won't help. You're still wrong.",
    "Your keyboard's crying from all the regrets you're backspacing.",
]

riddles = [
    ("What has keys but can't open locks?", "keyboard"),
    ("The more you take, the more you leave behind. What am I?", "footsteps"),
    ("What gets wetter as it dries?", "towel"),
    ("What has to be broken before you can use it?", "egg"),
    ("I'm tall when I'm young and short when I'm old. What am I?", "candle")
]

# --- Function Definitions ---
def show_notification(message):
    notification.notify(
        title="🔥 Gotcha!",
        message=message,
        timeout=3
    )

def spam_notifications():
    for _ in range(12):
        msg = random.choice(useless_facts + cringe_dialogues + roasts)
        show_notification(msg)
        time.sleep(5)

def show_riddle_lock():
    def check_answers():
        correct = 0
        for i in range(5):
            if entries[i].get().strip().lower() == riddles[i][1]:
                correct += 1
        if correct == 5:
            root.destroy()
        else:
            result_label.config(text=f"{correct}/5 correct. Try again!")

    root = tk.Toplevel()
    root.title("🧠 Solve to Escape!")
    tk.Label(root, text="Solve all 5 riddles to continue", font=("Comic Sans MS", 12, "bold")).pack(pady=5)

    entries = []
    for q, _ in riddles:
        tk.Label(root, text=q, font=("Comic Sans MS", 10)).pack()
        entry = tk.Entry(root, font=("Comic Sans MS", 10))
        entry.pack(pady=2)
        entries.append(entry)

    tk.Button(root, text="Submit", command=check_answers, font=("Comic Sans MS", 10), bg="#FFD700").pack(pady=5)
    result_label = tk.Label(root, text="", font=("Comic Sans MS", 10))
    result_label.pack()

    root.mainloop()

def on_key_press(key):
    try:
        if key == keyboard.Key.backspace:
            roast = random.choice(roasts)
            show_notification(roast)
    except:
        pass

def fake_notification_trigger():
    while running_event.is_set():
        time.sleep(30)
        if running_event.is_set():
            threading.Thread(target=spam_notifications).start()
            app.after(0, show_riddle_lock)  # triggers the riddle challenge in main thread


def start_app():
    global running_event
    start_btn.config(state="disabled")
    running_event.set()
    threading.Thread(target=fake_notification_trigger, daemon=True).start()
    threading.Thread(target=lambda: keyboard.Listener(on_press=on_key_press).run(), daemon=True).start()
    messagebox.showinfo("App Running", "App is now running in the background. Press Backspace anywhere!")

# --- GUI Interface ---
app = tk.Tk()
app.title("🎉 NotiLoop Prank App")
app.geometry("400x300")
app.configure(bg="#FFE4E1")

# Cartoon-style header
tk.Label(app, text="😈 Welcome to NotiLoop!", font=("Comic Sans MS", 16, "bold"), bg="#FFE4E1", fg="#FF1493").pack(pady=20)
tk.Label(app, text="Your fun, annoying prank app", font=("Comic Sans MS", 10), bg="#FFE4E1").pack(pady=5)

# Start button
start_btn = tk.Button(app, text="Start Chaos!", command=start_app, font=("Comic Sans MS", 12, "bold"), bg="#FF69B4", fg="white", relief="raised")
start_btn.pack(pady=30)




# Control flag
running_event = threading.Event()

def on_app_close():
    show_riddle_lock()

app.protocol("WM_DELETE_WINDOW", on_app_close)

# Launch GUI
app.mainloop()
