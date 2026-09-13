import 'dart:math';
import '../models/shy_state.dart';

class FunnyMessages {
  static final _random = Random();

  static const _calm = [
    "Finally... some privacy 😌",
    "Nobody is looking. Perfect.",
    "Ahhh, peace and quiet.",
    "I can finally relax.",
  ];

  static const _nervous = [
    "Oh... hi 😳",
    "Um... are you looking at me?",
    "This is getting slightly uncomfortable...",
    "Why are you staring?",
  ];

  static const _shy = [
    "Please don't stare 🫣",
    "Can you look at your phone instead?",
    "I'm not camera ready today!",
    "Can you turn away for a second?",
  ];

  static const _panic = [
    "WHY ARE YOU STILL STARING?! 😰",
    "PERSON OVERLOAD! TOO MUCH ATTENTION!",
    "MY LENS IS SWEATING!",
    "EVERYONE STOP LOOKING AT ME!",
  ];

  static const _extreme = [
    "I'M LEAVING! GOODBYE! 😭",
    "CAMERA HIDING... DO NOT DISTURB.",
    "NOPE NOPE NOPE.",
    "THIS IS TOO MUCH FOR ME!",
  ];

  static const _multiFace = [
    "WHY ARE THERE SO MANY OF YOU?! 😱",
    "THIS IS A CROWD! I CAN'T HANDLE THIS!",
    "TOO MANY EYES ON ME!",
  ];

  static String getMessage(ShyState state, int faceCount) {
    if (faceCount >= 2 && state == ShyState.panic) {
      return _multiFace[_random.nextInt(_multiFace.length)];
    }
    switch (state) {
      case ShyState.calm:
        return _calm[_random.nextInt(_calm.length)];
      case ShyState.nervous:
        return _nervous[_random.nextInt(_nervous.length)];
      case ShyState.shy:
        return _shy[_random.nextInt(_shy.length)];
      case ShyState.panic:
        return _panic[_random.nextInt(_panic.length)];
      case ShyState.extremePanic:
        return _extreme[_random.nextInt(_extreme.length)];
    }
  }
}