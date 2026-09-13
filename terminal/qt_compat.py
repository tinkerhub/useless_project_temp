"""
Qt Abstraction Compatibility Layer.
Supports both PySide6 and PyQt6 seamlessly on Linux distributions.
"""

try:
    from PySide6.QtCore import Qt, QSize, QSocketNotifier, Signal, QObject, QTimer
    from PySide6.QtGui import QFont, QColor, QTextCursor, QIcon, QKeySequence, QShortcut
    from PySide6.QtWidgets import (
        QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel,
        QPushButton, QTextEdit, QLineEdit, QFrame, QScrollArea, QApplication
    )
    QT_BINDING = "PySide6"
except ImportError:
    from PyQt6.QtCore import Qt, QSize, QSocketNotifier, pyqtSignal as Signal, QObject, QTimer
    from PyQt6.QtGui import QFont, QColor, QTextCursor, QIcon, QKeySequence, QShortcut
    from PyQt6.QtWidgets import (
        QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel,
        QPushButton, QTextEdit, QLineEdit, QFrame, QScrollArea, QApplication
    )
    QT_BINDING = "PyQt6"
