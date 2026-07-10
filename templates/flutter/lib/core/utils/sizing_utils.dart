import 'dart:math' as math;

import 'package:{{packageName}}/core/core.dart';

extension MediaQueryValues on BuildContext {
  Size get screenSize => MediaQuery.of(this).size;

  double get screenWidth => screenSize.width;
  double get screenHeight => screenSize.height;

  double get bottomSafeInset => MediaQuery.paddingOf(this).bottom;
  double get topSafeInset => MediaQuery.paddingOf(this).top;

  double fromBottom(double designOffset) => h(designOffset) + bottomSafeInset;

  SizedBox screenHeightSpace(double percent) =>
      SizedBox(height: percent * screenHeight);

  SizedBox screenWidthSpace(double percent) =>
      SizedBox(width: percent * screenWidth);

  double sp(double value) {
    final scale = screenWidth / SizeConfig.baseWidth;
    final adjustedScale = scale < 1 ? scale + 0.05 : scale;
    return adjustedScale * MediaQuery.of(this).textScaler.scale(value);
  }

  SizedBox verticalSpace(double value) {
    return screenWidth > SizeConfig.breakpoint
        ? SizedBox(height: value)
        : SizedBox(
            height: ((screenHeight / SizeConfig.baseHeight) * value).toDouble(),
          );
  }

  SizedBox horizontalSpace(double value) {
    return screenWidth > SizeConfig.breakpoint
        ? SizedBox(width: value)
        : SizedBox(
            width: ((screenWidth / SizeConfig.baseWidth) * value).toDouble(),
          );
  }

  double h(double value) {
    return screenWidth > SizeConfig.breakpoint
        ? value
        : ((screenHeight / SizeConfig.baseHeight) * value).toDouble();
  }

  double w(double value) {
    return screenWidth > SizeConfig.breakpoint
        ? value
        : ((screenWidth / SizeConfig.baseWidth) * value).toDouble();
  }

  double min(double value) => math.min(w(value), h(value));

  double max(double value) => math.max(w(value), h(value));

  EdgeInsets pad(EdgeInsets value) {
    return EdgeInsets.fromLTRB(
      w(value.left),
      h(value.top),
      w(value.right),
      h(value.bottom),
    );
  }

  EdgeInsets all(double value) {
    final scaled = min(value);
    return EdgeInsets.all(scaled);
  }

  EdgeInsets symmetric({double vertical = 0, double horizontal = 0}) {
    return EdgeInsets.symmetric(
      vertical: h(vertical),
      horizontal: w(horizontal),
    );
  }

  EdgeInsets only({
    double top = 0,
    double left = 0,
    double bottom = 0,
    double right = 0,
  }) {
    return EdgeInsets.only(
      top: h(top),
      left: w(left),
      right: w(right),
      bottom: h(bottom),
    );
  }

  EdgeInsets fromLTRB(
    double left,
    double top,
    double right,
    double bottom,
  ) {
    return EdgeInsets.fromLTRB(
      w(left),
      h(top),
      w(right),
      h(bottom),
    );
  }
}

class SizeConfig {
  static double breakpoint = 640;
  static double baseWidth = {{baseWidth}};
  static double baseHeight = {{baseHeight}};

  static const fontFamily = '{{fontFamily}}';
}
