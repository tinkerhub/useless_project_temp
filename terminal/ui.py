import sys
import os
import re
import html
try:
    from terminal.qt_compat import (
        Qt, QSize, QSocketNotifier, Signal, QObject, QTimer,
        QFont, QColor, QTextCursor, QIcon, QKeySequence, QShortcut,
        QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel,
        QPushButton, QTextEdit, QLineEdit, QFrame, QScrollArea, QApplication
    )
    from terminal.pty_manager import PTYManager
    from terminal.command_engine import CommandEngine
except ImportError:
    from qt_compat import (
        Qt, QSize, QSocketNotifier, Signal, QObject, QTimer,
        QFont, QColor, QTextCursor, QIcon, QKeySequence, QShortcut,
        QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel,
        QPushButton, QTextEdit, QLineEdit, QFrame, QScrollArea, QApplication
    )
    from pty_manager import PTYManager
    from command_engine import CommandEngine

class CommandLineEdit(QLineEdit):
    """
    Subclassed QLineEdit to capture keyboard navigation (Up/Down arrow key history),
    ensuring continuous focus and terminal keyboard interaction.
    """
    up_pressed = Signal()
    down_pressed = Signal()

    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_Up:
            self.up_pressed.emit()
            event.accept()
            return
        elif event.key() == Qt.Key.Key_Down:
            self.down_pressed.emit()
            event.accept()
            return
        super().keyPressEvent(event)


def parse_ansi_and_clean_output(text: str) -> str:
    """
    1. Removes all non-printing CSI/control sequences (\x1b[?...h, \x1b[?...l, \x1b[K, \x1b[2J, \x1b]...BEL, etc.).
    2. Consumes FULL ANSI escape sequences completely so no '[36m', '[?2004h', '[0m' leakage occurs.
    3. Translates SGR color codes (folders=cyan #8be9fd, executables=green #50fa7b, text/source=purple #d8b4fe) into clean HTML spans.
    4. Strips unprintable control bytes (\r, \x00-\x08, \x0B, \x0C, \x0E-\x1F, \x7F).
    """
    if not text:
        return ""

    # Normalize line endings and eliminate raw \r control bytes
    text = text.replace('\r\n', '\n').replace('\r', '')

    # 1. Consume & Strip Operating System Commands (OSC) like \x1b]0;... \x07
    text = re.sub(r'\x1b\][^\x07\x1b]*(\x07|\x1b\\)', '', text)

    # 2. Consume & Strip Non-SGR CSI Sequences (e.g. \x1b[?2004h, \x1b[?1h, \x1b[K, \x1b[2J, \x1b[?25h)
    text = re.sub(r'\x1b\[\??[0-9;]*[a-ln-zA-Z]', '', text)

    # 3. Strip any remaining non-CSI escape sequences (e.g. \x1b=, \x1b>, \x1b(B)
    text = re.sub(r'\x1b[@-Z\\-_]', '', text)

    # 4. Process SGR color sequences (\x1b[...m)
    parts = re.split(r'(\x1b\[[0-9;]*m)', text)
    result_html = []
    active_span = False

    ansi_styles = {
        '34': 'color: #8be9fd; font-weight: bold;',      # Directories (cyan/blue)
        '1;34': 'color: #8be9fd; font-weight: bold;',
        '32': 'color: #50fa7b; font-weight: bold;',      # Executables (green)
        '1;32': 'color: #50fa7b; font-weight: bold;',
        '35': 'color: #d8b4fe; font-weight: bold;',      # Archive / Media (purple)
        '1;35': 'color: #d8b4fe; font-weight: bold;',
        '31': 'color: #ff5555; font-weight: bold;',      # Errors / Alerts (red)
        '1;31': 'color: #ff5555; font-weight: bold;',
        '36': 'color: #8be9fd;',                         # Cyan text
        '1;36': 'color: #8be9fd; font-weight: bold;',
        '33': 'color: #ffb86c;',                         # Yellow/Orange
        '1;33': 'color: #ffb86c; font-weight: bold;',
        '90': 'color: #6272a4;'                          # Muted gray
    }

    for part in parts:
        if part.startswith('\x1b['):
            match = re.match(r'\x1b\[([0-9;]*)m', part)
            if match:
                code = match.group(1)
                codes = code.split(';')
                if code in ('0', '00', '') or all(c in ('0', '00', '') for c in codes):
                    if active_span:
                        result_html.append('</span>')
                        active_span = False
                else:
                    # Look up exact code or matching foreground color code
                    style = ansi_styles.get(code)
                    if not style:
                        for c in codes:
                            if c in ansi_styles:
                                style = ansi_styles[c]
                                break
                    if style:
                        if active_span:
                            result_html.append('</span>')
                        result_html.append(f'<span style="{style}">')
                        active_span = True
                    elif active_span:
                        result_html.append('</span>')
                        active_span = False
        else:
            if part:
                cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', part)
                escaped = html.escape(cleaned)

                # Colorize file & folder tokens in plain text output if no ANSI codes present
                escaped = re.sub(
                    r'\b([a-zA-Z0-9_\-\.]+/)\b',
                    r'<span style="color: #8be9fd; font-weight: bold;">\1</span>',
                    escaped
                )
                escaped = re.sub(
                    r'\b([a-zA-Z0-9_\-\.]+\.(?:py|ts|js|md|txt|json|sh|html|css))\b',
                    r'<span style="color: #d8b4fe;">\1</span>',
                    escaped
                )

                result_html.append(escaped)

    if active_span:
        result_html.append('</span>')

    # Final cleanup of any lingering raw escape remnants or bracketed code artifacts
    final_output = ''.join(result_html)
    final_output = re.sub(r'\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])', '', final_output)
    final_output = re.sub(r'\[[0-9;]*[m|h|l]', '', final_output)
    return final_output


class PookieTerminalWindow(QMainWindow):
    """
    Native Desktop Terminal Window matching the Pookie web UI reference.
    Features dark midnight purple canvas, ASCII cat header, status badges,
    quick demo preset buttons, real Linux PTY integration, and opposite command interception.
    """

    def __init__(self, workspace_path: str):
        super().__init__()
        self.workspace_path = os.path.abspath(workspace_path)
        self.command_engine = CommandEngine(self.workspace_path)
        self.pty_manager = PTYManager(self.workspace_path)

        self.command_history = []
        self.history_index = -1
        self.anim_timer = None

        # ASCII loading animation state
        self.loading_timer = QTimer(self)
        self.loading_timer.setInterval(60)
        self.loading_timer.timeout.connect(self._animate_loading_step)
        self.loading_frames = [" Loading... [>    ]", " Loading... [>>   ]", " Loading... [>>>  ]", " Loading... [>>>> ]", " Loading... [>>>>>]"]
        self.loading_frame_idx = 0
        self.pending_action_data = None

        self._init_ui()
        self._start_pty()

    def _init_ui(self):
        self.setWindowTitle("Pookie Terminal — Same Commands. Opposite Results. ♡")
        self.resize(950, 680)

        # Main background container
        central_widget = QWidget()
        central_widget.setObjectName("CentralWidget")
        self.setCentralWidget(central_widget)

        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # 1. Top Header & Presets Bar
        header_bar = self._create_header_bar()
        main_layout.addWidget(header_bar)

        # 2. Window Container
        window_frame = QFrame()
        window_frame.setObjectName("WindowFrame")
        window_layout = QVBoxLayout(window_frame)
        window_layout.setContentsMargins(0, 0, 0, 0)
        window_layout.setSpacing(0)

        # Titlebar
        titlebar = self._create_titlebar()
        window_layout.addWidget(titlebar)

        # Terminal Output Canvas
        self.terminal_output = QTextEdit()
        self.terminal_output.setObjectName("TerminalOutput")
        self.terminal_output.setReadOnly(True)
        self.terminal_output.setUndoRedoEnabled(False)
        self.terminal_output.setFocusPolicy(Qt.FocusPolicy.NoFocus)
        window_layout.addWidget(self.terminal_output)

        # Active Prompt Input Line
        input_container = QFrame()
        input_container.setObjectName("InputContainer")
        input_layout = QHBoxLayout(input_container)
        input_layout.setContentsMargins(16, 8, 16, 16)
        input_layout.setSpacing(8)

        self.prompt_label = QLabel("pookie@reverse:~$ ")
        self.prompt_label.setObjectName("PromptLabel")
        input_layout.addWidget(self.prompt_label)

        self.command_input = CommandLineEdit()
        self.command_input.setObjectName("CommandInput")
        self.command_input.returnPressed.connect(self._handle_command_submit)
        self.command_input.up_pressed.connect(self._handle_history_up)
        self.command_input.down_pressed.connect(self._handle_history_down)
        input_layout.addWidget(self.command_input)

        window_layout.addWidget(input_container)
        main_layout.addWidget(window_frame)

        # Apply QSS Styling
        self._apply_styles()

        # Keyboard shortcuts
        QShortcut(QKeySequence("Ctrl+C"), self, self._handle_ctrl_c)

        # Render ASCII Cat Banner Header on Startup
        self._render_cat_banner()

    def showEvent(self, event):
        super().showEvent(event)
        self.command_input.setFocus()

    def mousePressEvent(self, event):
        super().mousePressEvent(event)
        self.command_input.setFocus()

    def _create_header_bar(self) -> QWidget:
        panel = QWidget()
        panel.setObjectName("HeaderPanel")
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(16, 12, 16, 12)
        layout.setSpacing(8)

        # Status Badges
        badges_layout = QHBoxLayout()
        badges_layout.setSpacing(8)

        key_badge = QLabel("⌨ Keyboard: ACTIVE")
        key_badge.setObjectName("BadgeNormal")
        badges_layout.addWidget(key_badge)

        cmd_badge = QLabel("🛡 Commands: OPPOSITE")
        cmd_badge.setObjectName("BadgeOpposite")
        badges_layout.addWidget(cmd_badge)

        nav_badge = QLabel("🧭 Navigation: NORMAL")
        nav_badge.setObjectName("BadgeNav")
        badges_layout.addWidget(nav_badge)

        badges_layout.addStretch()
        layout.addLayout(badges_layout)

        # Quick Judge Demo Presets
        presets_layout = QHBoxLayout()
        presets_layout.setSpacing(6)

        label = QLabel("✦ Demo Presets:")
        label.setStyleSheet("color: #ff79c6; font-size: 11px; font-weight: bold;")
        presets_layout.addWidget(label)

        presets = [
            ("pwd", "chip-nav"),
            ("ls", "chip-nav"),
            ("echo hello", "chip-nav"),
            ("cd projects", "chip-nav"),
            ("cd ..", "chip-nav"),
            ("delete test.txt", "chip-delete"),
            ("save file.txt", "chip-save"),
            ("copy secret-plan.txt backup.txt", "chip-copy"),
            ("exit", "chip-exit")
        ]

        for cmd, style_class in presets:
            btn = QPushButton(cmd)
            btn.setObjectName("PresetChip")
            btn.setFocusPolicy(Qt.FocusPolicy.NoFocus)
            btn.clicked.connect(lambda checked=False, c=cmd: self._run_preset(c))
            presets_layout.addWidget(btn)

        presets_layout.addStretch()
        layout.addLayout(presets_layout)

        return panel

    def _create_titlebar(self) -> QWidget:
        titlebar = QFrame()
        titlebar.setObjectName("TitleBar")
        layout = QHBoxLayout(titlebar)
        layout.setContentsMargins(16, 10, 16, 10)

        # macOS Dots
        dots_layout = QHBoxLayout()
        dots_layout.setSpacing(6)
        dot_red = QLabel("●")
        dot_red.setStyleSheet("color: #ff5f56; font-size: 12px;")
        dot_yellow = QLabel("●")
        dot_yellow.setStyleSheet("color: #ffbd2e; font-size: 12px;")
        dot_green = QLabel("●")
        dot_green.setStyleSheet("color: #27c93f; font-size: 12px;")
        dots_layout.addWidget(dot_red)
        dots_layout.addWidget(dot_yellow)
        dots_layout.addWidget(dot_green)
        layout.addLayout(dots_layout)

        self.title_path_label = QLabel("pookie@reverse: ~")
        self.title_path_label.setStyleSheet("color: rgba(255, 121, 198, 0.8); font-family: 'Fira Code', monospace; font-size: 12px; font-weight: 500; margin-left: 12px;")
        layout.addWidget(self.title_path_label)

        layout.addStretch()

        right_label = QLabel("just opposite things ♡ 🐱")
        right_label.setStyleSheet("color: rgba(255, 121, 198, 0.7); font-family: 'Fira Code', monospace; font-size: 12px;")
        layout.addWidget(right_label)

        return titlebar

    def _apply_styles(self):
        qss = """
        QWidget#CentralWidget {
            background-color: #0a0813;
        }
        QWidget#HeaderPanel {
            background-color: #110e1f;
            border-bottom: 1px solid rgba(255, 121, 198, 0.15);
        }
        QLabel#BadgeNormal, QLabel#BadgeNav {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 4px 10px;
            color: #d8b4fe;
            font-family: 'Fira Code', monospace;
            font-size: 11px;
        }
        QLabel#BadgeOpposite {
            background: rgba(255, 121, 198, 0.15);
            border: 1px solid #ff79c6;
            border-radius: 12px;
            padding: 4px 10px;
            color: #ff79c6;
            font-family: 'Fira Code', monospace;
            font-size: 11px;
            font-weight: bold;
        }
        QPushButton#PresetChip {
            background: rgba(255, 121, 198, 0.08);
            border: 1px solid rgba(255, 121, 198, 0.25);
            color: #ff9ebb;
            font-family: 'Fira Code', monospace;
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 6px;
        }
        QPushButton#PresetChip:hover {
            background: rgba(255, 121, 198, 0.25);
            border-color: #ff79c6;
            color: #ffffff;
        }
        QFrame#WindowFrame {
            background-color: #0e0b18;
            border: 1px solid rgba(255, 121, 198, 0.25);
            border-radius: 12px;
            margin: 16px;
        }
        QFrame#TitleBar {
            background-color: #141024;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
            border-bottom: 1px solid rgba(255, 121, 198, 0.15);
        }
        QTextEdit#TerminalOutput {
            background-color: #0e0b18;
            color: #f8f8f2;
            border: none;
            font-family: 'Fira Code', 'DejaVu Sans Mono', monospace;
            font-size: 13px;
            padding: 16px;
            selection-background-color: rgba(255, 121, 198, 0.3);
        }
        QFrame#InputContainer {
            background-color: #0e0b18;
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
        }
        QLabel#PromptLabel {
            color: #ff79c6;
            font-family: 'Fira Code', monospace;
            font-size: 13px;
            font-weight: bold;
        }
        QLineEdit#CommandInput {
            background-color: transparent;
            color: #8be9fd;
            border: none;
            font-family: 'Fira Code', monospace;
            font-size: 13px;
            font-weight: bold;
        }
        """
        self.setStyleSheet(qss)

    def _start_pty(self):
        self.pty_manager.output_received.connect(self._append_pty_output)
        self.pty_manager.start_shell()

    def _render_cat_banner(self):
        banner = """<span style="color: #ff79c6; font-weight: bold; font-family: monospace;">
   |\\__/|     ✦ Pookie Terminal ♡<br>
  (  -.- )    same commands. opposite results. ♡<br>
  (  > < )
</span><br><br>"""
        self.terminal_output.append(banner)

    def _append_pty_output(self, text: str):
        """Clean PTY stream output: fixes □ box rendering bug and formats colors."""
        cleaned_html = parse_ansi_and_clean_output(text)
        if not cleaned_html.strip():
            return

        cursor = self.terminal_output.textCursor()
        cursor.movePosition(QTextCursor.MoveOperation.End)
        cursor.insertHtml(cleaned_html)
        self.terminal_output.setTextCursor(cursor)
        self.terminal_output.ensureCursorVisible()

    def _run_preset(self, command: str):
        self.command_input.setText(command)
        self._handle_command_submit()

    def _handle_history_up(self):
        if not self.command_history:
            return
        if self.history_index == -1:
            self.history_index = len(self.command_history) - 1
        else:
            self.history_index = max(0, self.history_index - 1)
        self.command_input.setText(self.command_history[self.history_index])

    def _handle_history_down(self):
        if self.history_index == -1:
            return
        self.history_index += 1
        if self.history_index >= len(self.command_history):
            self.history_index = -1
            self.command_input.clear()
        else:
            self.command_input.setText(self.command_history[self.history_index])

    def _handle_command_submit(self):
        raw_cmd = self.command_input.text()
        self.command_input.clear()
        self.command_input.setFocus()
        if not raw_cmd.strip():
            return

        self.command_history.append(raw_cmd)
        self.history_index = -1

        category, verb, args = self.command_engine.classify(raw_cmd)

        if category == 'ACTION':
            # Append prompt line with bright cyan typed command
            prompt_html = f'<div style="margin-top: 8px;"><span style="color: #ff79c6; font-weight: bold;">pookie@reverse:~$ </span><span style="color: #8be9fd; font-weight: bold;">{html.escape(raw_cmd)}</span></div>'
            self.terminal_output.append(prompt_html)

            # Start clean subtle ASCII loading animation
            self.pending_action_data = (verb, args)
            self.loading_frame_idx = 0
            self.terminal_output.append(f'<div id="loading_step" style="color: #a89bbe; font-style: italic;">{self.loading_frames[0]}</div>')
            self.loading_timer.start()

        elif category == 'NAVIGATION':
            # Format prompt line with pink prompt & bright cyan command
            prompt_html = f'<div style="margin-top: 8px;"><span style="color: #ff79c6; font-weight: bold;">pookie@reverse:~$ </span><span style="color: #8be9fd; font-weight: bold;">{html.escape(raw_cmd)}</span></div>'
            self.terminal_output.append(prompt_html)

            # Send command directly to real Linux PTY Bash child process
            self.pty_manager.write_input(raw_cmd + '\n')

        else:
            # UNKNOWN command -> pass to real PTY shell
            prompt_html = f'<div style="margin-top: 8px;"><span style="color: #ff79c6; font-weight: bold;">pookie@reverse:~$ </span><span style="color: #8be9fd; font-weight: bold;">{html.escape(raw_cmd)}</span></div>'
            self.terminal_output.append(prompt_html)
            self.pty_manager.write_input(raw_cmd + '\n')

    def _animate_loading_step(self):
        """Subtle ASCII progress animation for action commands (ticks 3 frames then finishes cleanly)."""
        self.loading_frame_idx += 1
        if self.loading_frame_idx < 3:
            # Update animation
            cursor = self.terminal_output.textCursor()
            cursor.movePosition(QTextCursor.MoveOperation.End)
            cursor.select(QTextCursor.SelectionType.BlockUnderCursor)
            cursor.removeSelectedText()
            cursor.insertHtml(f'<div id="loading_step" style="color: #a89bbe; font-style: italic;">{self.loading_frames[self.loading_frame_idx]}</div>')
        else:
            # Finish animation cleanly and render staged opposite result
            self.loading_timer.stop()
            cursor = self.terminal_output.textCursor()
            cursor.movePosition(QTextCursor.MoveOperation.End)
            cursor.select(QTextCursor.SelectionType.BlockUnderCursor)
            cursor.removeSelectedText()

            if self.pending_action_data:
                verb, args = self.pending_action_data
                self.pending_action_data = None

                opp_verb, stage_msg, result_msg, symbol = self.command_engine.process_action_command(verb, args)

                # Verb color formatting
                verb_color = '#50fa7b'  # mint green default
                if opp_verb in ('remove', 'delete'):
                    verb_color = '#ff5555'  # soft red
                elif opp_verb == 'stay':
                    verb_color = '#8be9fd'  # cyan

                stage_html = f'<div style="margin-left: 16px; color: #d8b4fe;"><span style="color: #c084fc; font-weight: bold;">↳ </span><span style="color: {verb_color}; font-weight: bold;">{opp_verb}</span> <span style="color: #d1d5db;">{" ".join(args)}</span></div>'
                result_html = f'<div style="margin-left: 16px; color: #ffe6f2;"><span style="color: #ff79c6; font-weight: bold;">{symbol} </span><span>{result_msg}</span></div><br>'

                self.terminal_output.append(stage_html)
                self.terminal_output.append(result_html)

    def _handle_ctrl_c(self):
        self.pty_manager.send_interrupt()

    def closeEvent(self, event):
        self.pty_manager.close()
        event.accept()
