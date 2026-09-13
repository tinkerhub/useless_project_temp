import 'dart:convert';
import 'package:http/http.dart' as http;

class LlmCritic {
  static Future<String> generateRoast() async {
    try {
      final response = await http.post(
        Uri.parse('http://10.0.2.2:11434/api/generate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'model': 'llama3.2:1b', // or qwen2.5:1.5b running locally via Ollama
          'prompt': 'Act as an arrogant, hyper-critical fine-art photography snob. Give a brutal 1-sentence roast for a digital photo that is tilted, blurry, and strategically ruined.',
          'stream': false,
        }),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return (data['response'] as String?)?.trim() ?? 'Visually offensive.';
      }
    } catch (e) {
      // Graceful fallback if Ollama isn't spun up during a live demo minute
    }
    return '"Even our local quant model refuses to index this optical crime."';
  }
}