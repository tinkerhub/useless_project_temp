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
}

class ChatApiService {
  final String baseUrl;

  ChatApiService({required this.baseUrl});

  Future<String> sendMessage(String message) async {
    try {
      print('Sending message to: $baseUrl/get_response');
      print('Message content: $message');

      final response = await http.post(
        Uri.parse('$baseUrl/get_response'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({
          'prompt': message,
        }),
      );

      print('Response status code: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData.containsKey('response')) {
          return responseData['response'] as String;
        } else {
          throw Exception('Invalid response format from server');
        }
      } else {
        throw Exception('Failed to get response: ${response.statusCode}');
      }
    } catch (e) {
      print('Error in sendMessage: $e');
      throw Exception('Failed to communicate with the server: $e');
    }
  }
}

class ChatProvider extends ChangeNotifier {
  final ChatApiService _apiService;
  final List<Message> _messages = [];
  bool _isLoading = false;

  ChatProvider(this._apiService);

  List<Message> get messages => List.unmodifiable(_messages);
  bool get isLoading => _isLoading;

  Future<void> sendMessage(String content) async {
    if (content.trim().isEmpty) return;

    _isLoading = true;
    notifyListeners();

    try {
      // Add user message immediately
      _messages.add(Message(
        content: content,
        isUser: true,
        timestamp: _formatTimestamp(DateTime.now()),
      ));
      notifyListeners();

      // Get bot response
      final response = await _apiService.sendMessage(content);
      
      // Add bot message
      _messages.add(Message(
        content: response.trim(),
        isUser: false,
        timestamp: _formatTimestamp(DateTime.now()),
      ));
    } catch (e) {
      print('Error in ChatProvider.sendMessage: $e');
      _messages.add(Message(
        content: "Sorry, I couldn't process your message. Please try again.",
        isUser: false,
        timestamp: _formatTimestamp(DateTime.now()),
      ));
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  String _formatTimestamp(DateTime timestamp) {
    return '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}';
  }
}

