# RagebaitOS App Development Guide

## App Structure

Each application must have its own folder.

Example:

src/apps/calculator/

    calculator.js
    calculator.css

## App Rules

1. Extend AppBase.
2. Give the app a unique ID.
3. Give the app a name and icon.
4. Implement render().
5. Keep app-specific CSS inside the app folder.
6. Use unique CSS class names.
7. Keep app-specific rage mechanics inside the app folder.
8. Do not modify the global Rage Engine for app-specific behavior.
9. Do not modify WindowManager for app-specific behavior.
10. Do not modify global CSS unless absolutely necessary.

## Registration

Apps are registered from src/main.js.

Example:

appManager.registerApp(
    new CalculatorApp()
);

## Branching

Create a separate branch for each application.

Example:

feature/calculator
feature/browser
feature/weather

Try to keep changes inside your app's folder.