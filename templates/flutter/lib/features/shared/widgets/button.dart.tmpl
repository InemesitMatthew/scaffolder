import 'package:{{packageName}}/core/core.dart';
import 'package:{{packageName}}/features/features.dart';

class Button extends StatelessWidget {
  const Button({
    super.key,
    this.onTap,
    this.title,
    this.child,
    this.leading,
    this.trailing,
    this.filled = true,
    this.isBusy = false,
    this.isDisabled = false,
    this.color,
    this.textColor,
    this.width,
    this.height,
    this.padding,
    this.borderRadius = 100,
    this.shadow = true,
    this.hasInfiniteWidth = true,
    this.fontSize,
    this.textHeight,
    this.fontWeight,
  });

  final VoidCallback? onTap;
  final String? title;
  final Widget? child;
  final Widget? leading;
  final Widget? trailing;
  final bool filled;
  final bool isBusy;
  final bool isDisabled;
  final bool shadow;
  final Color? color;
  final Color? textColor;
  final double? width;
  final double? height;
  final EdgeInsets? padding;
  final double borderRadius;
  final bool? hasInfiniteWidth;
  final double? fontSize;
  final double? textHeight;
  final FontWeight? fontWeight;

  void _onTap() {
    if (isDisabled) {
      HapticFeedback.vibrate();
      return;
    }
    onTap?.call();
  }

  Color _resolveBackgroundColor() {
    if (!filled) return Colors.transparent;
    if (isDisabled) return Palette.white600;
    return color ?? Palette.basePrimary;
  }

  Color _resolveTextColor() {
    if (textColor != null) return textColor!;
    if (!filled) return color ?? Palette.white;
    if (isDisabled) return Palette.black200;
    return Palette.white;
  }

  @override
  Widget build(BuildContext context) {
    final childContent = child ??
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (leading != null) ...[
              leading!,
              const SizedBox(width: 8),
            ],
            if (isBusy)
              SizedBox(
                height: context.h(20),
                width: context.w(20),
                child: const CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Palette.primary30,
                  backgroundColor: Palette.primary400,
                ),
              )
            else
              Flexible(
                child: FittedBox(
                  fit: BoxFit.contain,
                  child: TextWidget(
                    title ?? '',
                    textColor: _resolveTextColor(),
                    fontSize: fontSize ?? 14,
                    fontWeight: fontWeight ?? Weight.w500,
                    height: textHeight ?? 1.45,
                  ),
                ),
              ),
            if (trailing != null) ...[
              const SizedBox(width: 8),
              trailing!,
            ],
          ],
        );

    return ClickWidget(
      onTap: _onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: width ??
            (hasInfiniteWidth == true ? context.screenWidth : width),
        height: height ?? 52,
        padding: padding ?? const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: _resolveBackgroundColor(),
          borderRadius: BorderRadius.circular(borderRadius),
          border: Border.all(
            color: filled ? Colors.transparent : (color ?? Colors.blue),
          ),
          boxShadow: shadow && !isDisabled
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: .1),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [],
        ),
        child: Center(child: childContent),
      ),
    );
  }
}
