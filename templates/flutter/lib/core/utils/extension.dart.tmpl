import 'package:{{packageName}}/core/core.dart';

extension DurationExtension on num {
  Duration get milliseconds => Duration(milliseconds: round());
  Duration get seconds => Duration(seconds: round());
  Duration get minutes => Duration(minutes: round());
  Duration get hours => Duration(hours: round());
  Duration get days => Duration(days: round());
}

extension IterableExtension<T> on Iterable<T> {
  T? firstWhereOrNull(bool Function(T) test) {
    for (final element in this) {
      if (test(element)) return element;
    }
    return null;
  }
}

extension CapitalizeWords on String {
  String get capitalizeWords {
    return split(' ').map((word) {
      if (word.isNotEmpty) {
        return word[0].toUpperCase() + word.substring(1);
      }
      return word;
    }).join(' ');
  }

  String capitalize() {
    if (isEmpty) return this;
    return substring(0, 1).toUpperCase() + substring(1).toLowerCase();
  }

  String? validateIsNotEmpty() {
    if (isEmpty) return 'Field cannot be empty';
    return null;
  }

  String? validateEmail() {
    if (isEmpty) return 'Email is required';
    final pattern = RegExp(
      r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+",
    );
    if (pattern.hasMatch(this)) return null;
    return 'Please enter a valid email address';
  }

  bool get isValidEmail {
    if (isEmpty) return false;
    final pattern = RegExp(
      r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+",
    );
    return pattern.hasMatch(this);
  }

  String? validateFieldNotEmpty(String field) {
    if (isEmpty) return '$field is required';
    return null;
  }
}

extension WidgetExtension on Widget {
  Widget expand({int? flex}) {
    return Expanded(
      flex: flex ?? 1,
      child: this,
    );
  }

  Widget scroll({
    ScrollPhysics? scrollPhysics,
    EdgeInsetsGeometry? padding,
    ScrollController? controller,
  }) {
    return SingleChildScrollView(
      controller: controller,
      physics: scrollPhysics ?? const ClampingScrollPhysics(),
      padding: padding,
      child: this,
    );
  }

  Widget padding({
    double? horizontal,
    double? vertical,
  }) {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: horizontal ?? 0,
        vertical: vertical ?? 0,
      ),
      child: this,
    );
  }
}

extension WidgetsList on List<Widget> {
  List<Widget> separate(Widget separator) {
    final separatedList = <Widget>[];
    for (var i = 0; i < length; i++) {
      separatedList.add(this[i]);
      if (i < length - 1) {
        separatedList.add(separator);
      }
    }
    return separatedList;
  }
}
