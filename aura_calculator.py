import customtkinter as ctk
from tkinter import messagebox

class AuraCalculator:
    def __init__(self, root):
        self.root = root
        self.root.title("Aura Calculator")
        ctk.set_appearance_mode("dark")  # Use dark mode for a modern look
        ctk.set_default_color_theme("green")  # Change the theme to your liking

        self.users = {}
        self.current_user = None

        # Predefined actions with points
        self.actions = {
            "Backflip in front of a crowd": 1000,
            "Helping an elderly person cross the street": 500,
            "Winning a local talent show": 800,
            "Making a perfect joke at the right moment": 300,
            "Successfully organizing a group event": 600,
            "Dressing in a unique, stylish outfit": 400,
            "Winning a challenging game of chess": 200,
            "Volunteering at a charity event": 700,
            "Saving a friend from an embarrassing situation": 400,
            "Completing a marathon": 1000,
            "Slipping and falling in public": -1000,
            "Failing to show up for a friend’s party": -500,
            "Making a joke that falls flat": -300,
            "Getting caught cheating in a game": -800,
            "Arguing loudly with someone in public": -600,
            "Showing up late to an important event": -400,
            "Spilling coffee on your shirt before a meeting": -200,
            "Interrupting someone during a conversation": -300,
            "Bragging too much about your achievements": -400,
            "Forgetting a close friend's birthday": -600,
        }

        self.filtered_actions = list(self.actions.keys())

        # Add a logo (replace with your own path if you have a logo image)
        self.logo = ctk.CTkLabel(root, text=" 🗿Aura Calculator ✨", font=("Helvetica", 24, "bold"))
        self.logo.grid(row=0, column=0, columnspan=3, pady=10)

        # UI Elements
        self.username_entry = ctk.CTkEntry(root, placeholder_text="Enter Username", width=300)
        self.username_entry.grid(row=1, column=1, padx=10, pady=5)
        ctk.CTkLabel(root, text="Username:", font=("Helvetica", 14)).grid(row=1, column=0)

        self.register_button = ctk.CTkButton(root, text="Register", command=self.register_user, width=120)
        self.register_button.grid(row=1, column=2)

        # Search bar for actions
        self.search_entry = ctk.CTkEntry(root, placeholder_text="Search Action", width=300)
        self.search_entry.grid(row=2, column=1, padx=10, pady=5)
        self.search_entry.bind("<KeyRelease>", self.filter_actions)
        ctk.CTkLabel(root, text="Search Action:", font=("Helvetica", 14)).grid(row=2, column=0)

        # Dropdown for selecting actions
        self.selected_action = ctk.StringVar()
        self.action_menu = ctk.CTkOptionMenu(root, variable=self.selected_action, values=self.filtered_actions, width=300)
        self.selected_action.set("Select an action")
        self.action_menu.grid(row=3, column=1, padx=10, pady=5)
        ctk.CTkLabel(root, text="Action:", font=("Helvetica", 14)).grid(row=3, column=0)

        self.add_action_button = ctk.CTkButton(root, text="Add Action", command=self.add_action, width=120)
        self.add_action_button.grid(row=3, column=2)

        self.balance_label = ctk.CTkLabel(root, text="Aura Balance: N/A", font=("Helvetica", 16))
        self.balance_label.grid(row=4, columnspan=3, pady=10)

        # Action History Listbox
        self.history_listbox = ctk.CTkTextbox(root, width=500, height=200, font=("Helvetica", 12))
        self.history_listbox.grid(row=5, column=0, columnspan=2, padx=10, pady=5)
        
        # Delete Action Button
        self.delete_action_button = ctk.CTkButton(root, text="Delete Selected Action", command=self.delete_action, width=200)
        self.delete_action_button.grid(row=5, column=2)

    def register_user(self):
        username = self.username_entry.get().strip()
        if username in self.users:
            messagebox.showerror("Error", "User already exists!")
        elif not username:
            messagebox.showerror("Error", "Username cannot be empty!")
        else:
            self.users[username] = {'balance': 0, 'actions': []}
            self.current_user = username
            messagebox.showinfo("Success", f"User {username} registered!")
            self.update_balance_label()
            self.update_action_history()

    def add_action(self):
        if not self.current_user:
            messagebox.showerror("Error", "No user registered or selected!")
            return

        action = self.selected_action.get()
        if action == "Select an action":
            messagebox.showerror("Error", "Please select a valid action!")
            return

        points = self.actions[action]
        user_data = self.users[self.current_user]
        user_data['actions'].append({'action': action, 'points': points})
        user_data['balance'] += points
        self.update_balance_label()
        self.update_action_history()
        messagebox.showinfo("Success", f"Action added: {action} ({points} points)")

    def delete_action(self):
        selected_text = self.history_listbox.get("1.0", "end").splitlines()
        if not selected_text or selected_text[0] == "":
            messagebox.showerror("Error", "No action selected for deletion!")
            return
        
        user_data = self.users[self.current_user]
        action_text = selected_text.pop(0)
        action_to_delete = user_data['actions'].pop(0)
        user_data['balance'] -= action_to_delete['points']
        self.update_balance_label()
        self.update_action_history()
        messagebox.showinfo("Success", f"Deleted action: {action_to_delete['action']} ({action_to_delete['points']} points)")

    def update_balance_label(self):
        if self.current_user:
            balance = self.users[self.current_user]['balance']
            self.balance_label.configure(text=f"Aura Balance: {balance}")

    def update_action_history(self):
        self.history_listbox.delete("1.0", "end")
        if self.current_user:
            for action in self.users[self.current_user]['actions']:
                action_text = f"{action['action']} ({action['points']} points)\n"
                self.history_listbox.insert("end", action_text)

    def filter_actions(self, event):
        search_term = self.search_entry.get().lower()
        self.filtered_actions = [action for action in self.actions if search_term in action.lower()]
        self.update_action_menu()

    def update_action_menu(self):
        self.action_menu.set(self.filtered_actions[0] if self.filtered_actions else "No actions found")
        self.action_menu.configure(values=self.filtered_actions)

if __name__ == "__main__":
    
    root = ctk.CTk()
    app = AuraCalculator(root)
    root.mainloop()