// api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';

class Message {
  final String content;
  final bool isUser;
  final String timestamp;

  Message({
    required this.content,
    required this.isUser,
    required this.timestamp,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      content: json['content'],
      isUser: json['isUser'],
      timestamp: json['timestamp'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'content': content,
      'isUser': isUser,
      'timestamp': timestamp,
    };
  }
}

class ChatApiService {
  final String baseUrl; // Replace with your API URL
  final String apiKey; // If required by your API

  ChatApiService({
    required this.baseUrl,
    required this.apiKey,
  });

  Future<Message> sendMessage(String message) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/chat'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiKey',
        },
        body: jsonEncode({
          'message': message,
        }),
      );

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        return Message.fromJson(responseData);
      } else {
        throw Exception('Failed to send message: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error sending message: $e');
    }
  }

  Future<List<Message>> getMessageHistory() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/history'),
        headers: {
          'Authorization': 'Bearer $apiKey',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> responseData = jsonDecode(response.body);
        return responseData.map((json) => Message.fromJson(json)).toList();
      } else {
        throw Exception(
            'Failed to get message history: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error getting message history: $e');
    }
  }
}

// chat_provider.dart

class ChatProvider extends ChangeNotifier {
  final ChatApiService _apiService;
  List<Message> _messages = [];
  bool _isLoading = false;

  ChatProvider(this._apiService);

  List<Message> get messages => _messages;
  bool get isLoading => _isLoading;

  Future<void> sendMessage(String content) async {
    _isLoading = true;
    notifyListeners();

    try {
      // Add user message immediately
      final userMessage = Message(
        content: content,
        isUser: true,
        timestamp: DateTime.now().toString(),
      );
      _messages.add(userMessage);
      notifyListeners();

      // Get bot response
      final botResponse = await _apiService.sendMessage(content);
      _messages.add(botResponse);
    } catch (e) {
      debugPrint('Error sending message: $e');
      // Handle error (show snackbar, etc.)
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMessageHistory() async {
    _isLoading = true;
    notifyListeners();

    try {
      _messages = await _apiService.getMessageHistory();
    } catch (e) {
      debugPrint('Error loading message history: $e');
      // Handle error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
