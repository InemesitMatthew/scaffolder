import 'package:{{packageName}}/core/core.dart';
import 'package:{{packageName}}/features/features.dart';

class TextFieldWidget extends StatefulWidget {
  const TextFieldWidget({
    super.key,
    this.hintText,
    this.suffix,
    this.initialValue,
    this.keyboardType,
    this.textInputAction,
    this.prefixIcon,
    this.maxLine,
    this.isPassword = false,
    this.fillColor = Palette.fillColor,
    this.inputFormatters,
    this.hintColor,
    this.hintFontSize,
    this.validator,
    this.controller,
    this.title,
    this.onTap,
    this.onChanged,
    this.isReadOnly = false,
    this.contentPadding,
    this.textFontSize,
    this.error,
    this.onFieldSubmitted,
    this.textCapitalization = TextCapitalization.none,
    this.focusNode,
    this.autovalidateMode = AutovalidateMode.onUserInteraction,
    this.validateOnFocusLost = false,
    this.borderRadius,
  });

  final String? hintText;
  final String? initialValue;
  final Widget? suffix;
  final bool isPassword;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Widget? prefixIcon;
  final int? maxLine;
  final Color? fillColor;
  final Color? hintColor;
  final double? hintFontSize;
  final String? Function(String?)? validator;
  final TextEditingController? controller;
  final List<TextInputFormatter>? inputFormatters;
  final String? title;
  final bool isReadOnly;
  final EdgeInsets? contentPadding;
  final double? textFontSize;
  final VoidCallback? onTap;
  final void Function(String)? onChanged;
  final String? error;
  final void Function(String)? onFieldSubmitted;
  final TextCapitalization textCapitalization;
  final FocusNode? focusNode;
  final AutovalidateMode autovalidateMode;
  final bool validateOnFocusLost;
  final double? borderRadius;

  @override
  State<TextFieldWidget> createState() => _TextFieldWidgetState();
}

class _TextFieldWidgetState extends State<TextFieldWidget> {
  final ValueNotifier<bool> obscureText = ValueNotifier<bool>(true);
  final GlobalKey<FormFieldState<String>> _fieldKey =
      GlobalKey<FormFieldState<String>>();
  bool _wasFocused = false;
  bool _hasFocus = false;

  @override
  void dispose() {
    obscureText.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: obscureText,
      builder: (__, value, _) {
        return GestureDetector(
          onTap: widget.onTap,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (widget.title != null) ...[
                TextWidget(widget.title!),
                context.verticalSpace(8),
              ],
              Focus(
                onFocusChange: (hasFocus) {
                  _hasFocus = hasFocus;
                  if (hasFocus) {
                    _wasFocused = true;
                  } else if (_wasFocused && widget.validateOnFocusLost) {
                    _fieldKey.currentState?.validate();
                  }
                },
                child: TextFormField(
                  key: _fieldKey,
                  onTap: widget.onTap,
                  textCapitalization: widget.textCapitalization,
                  focusNode: widget.focusNode,
                  initialValue: widget.initialValue,
                  readOnly: widget.isReadOnly,
                  controller: widget.controller,
                  maxLines: widget.maxLine ?? 1,
                  cursorColor: Palette.basePrimary,
                  textInputAction: widget.textInputAction,
                  keyboardType: widget.keyboardType,
                  obscureText: value && widget.isPassword,
                  onChanged: (val) {
                    widget.onChanged?.call(val);
                    if (widget.validateOnFocusLost && _wasFocused) {
                      _fieldKey.currentState?.validate();
                    }
                  },
                  style: TextStyle(
                    fontFamily: SizeConfig.fontFamily,
                    fontSize: widget.textFontSize ?? context.sp(16),
                    color: Palette.text100,
                    fontFamilyFallback: const ['Inter'],
                  ),
                  autovalidateMode: widget.autovalidateMode,
                  inputFormatters: widget.inputFormatters,
                  validator: (val) {
                    final validator = widget.validator;
                    if (validator == null) return null;
                    if (widget.validateOnFocusLost) {
                      if (val == null || val.trim().isEmpty) {
                        return 'This field is required';
                      }
                      if (_hasFocus) return null;
                    }
                    return validator(val);
                  },
                  autocorrect: false,
                  onFieldSubmitted: widget.onFieldSubmitted,
                  onTapOutside: (_) => FocusScope.of(context).unfocus(),
                  decoration: InputDecoration(
                    prefixIcon: widget.prefixIcon,
                    fillColor: widget.fillColor,
                    isDense: true,
                    filled: widget.fillColor != null,
                    hintText: widget.hintText,
                    hintStyle: TextStyle(
                      fontFamily: SizeConfig.fontFamily,
                      color: widget.hintColor ?? Palette.text300,
                      fontSize: context.sp(widget.hintFontSize ?? 14),
                      fontWeight: FontWeight.w400,
                      fontFamilyFallback: const ['Inter'],
                    ),
                    suffixIcon: widget.isPassword
                        ? _suffixWidget(value)
                        : widget.suffix,
                    contentPadding: widget.contentPadding ??
                        (widget.suffix != null || widget.prefixIcon != null
                            ? context.all(12)
                            : context.all(15)),
                    border: _border,
                    errorMaxLines: 3,
                    errorStyle: TextStyle(
                      fontFamily: SizeConfig.fontFamily,
                      fontSize: context.sp(12),
                      color: Palette.baseError,
                      fontFamilyFallback: const ['Inter'],
                    ),
                    disabledBorder: _border,
                    enabledBorder: _border,
                    focusedBorder: _border,
                  ),
                ),
              ),
              if (widget.error != null) ...[
                context.verticalSpace(8),
                TextWidget(
                  widget.error!,
                  fontSize: 11,
                  fontWeight: Weight.w400,
                  textColor: Palette.baseError,
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  OutlineInputBorder get _border {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(
        widget.borderRadius ?? context.w(8),
      ),
      borderSide: BorderSide(
        color: widget.error != null ? Palette.baseError : Palette.border,
        width: widget.isReadOnly ? 0.5 : 1,
      ),
    );
  }

  Widget _suffixWidget(bool value) {
    return ClickWidget(
      onTap: () => obscureText.value = !obscureText.value,
      child: Icon(
        value ? Icons.visibility_outlined : Icons.visibility_off_outlined,
        color: Palette.text300,
      ),
    );
  }
}
