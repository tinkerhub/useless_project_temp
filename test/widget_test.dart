import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kolamass/app/app.dart';

void main() {
  testWidgets('landing page displays KOLA MASS', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: CruelWorldApp()));

    await tester.pumpAndSettle();

    expect(find.text('KOLA MASS'), findsOneWidget);
    expect(find.text('ENTER THE WORLD'), findsOneWidget);
  });
}
