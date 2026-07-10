import 'package:{{packageName}}/core/core.dart';
import 'package:{{packageName}}/features/features.dart';

class BaseScaffold extends StatelessWidget {
  const BaseScaffold({
    super.key,
    this.drawer,
    this.bottomNavigationBar,
    this.floatingActionButton,
    required this.body,
    this.appBar,
    this.useSidePadding = true,
    required this.useSingleScroll,
    this.bg = Palette.white,
    this.scaffoldKey,
    this.controller,
    this.scrollPhysics,
    this.safeAreaTop,
    this.safeAreaBottom,
    this.extendBody,
    this.resizeToAvoidInsets,
    this.bottomSheet,
    this.onDrawerChanged,
  });

  final Widget? drawer;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final Widget body;
  final PreferredSizeWidget? appBar;
  final bool useSidePadding;
  final bool useSingleScroll;
  final bool? resizeToAvoidInsets;
  final Color? bg;
  final GlobalKey<ScaffoldState>? scaffoldKey;
  final ScrollController? controller;
  final ScrollPhysics? scrollPhysics;
  final bool? safeAreaTop;
  final bool? safeAreaBottom;
  final bool? extendBody;
  final Widget? bottomSheet;
  final ValueChanged<bool>? onDrawerChanged;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        drawerEnableOpenDragGesture: true,
        key: scaffoldKey,
        onDrawerChanged: onDrawerChanged,
        appBar: appBar,
        resizeToAvoidBottomInset: resizeToAvoidInsets,
        extendBody: extendBody ?? true,
        extendBodyBehindAppBar: true,
        backgroundColor: bg,
        bottomSheet: bottomSheet,
        body: SafeArea(
          top: safeAreaTop ?? true,
          bottom: safeAreaBottom ?? true,
          child: useSingleScroll
              ? SingleChildScrollView(
                  controller: controller,
                  physics:
                      scrollPhysics ?? const AlwaysScrollableScrollPhysics(),
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(
                      useSidePadding ? 16 : 0,
                      0,
                      useSidePadding ? 16 : 0,
                      0,
                    ),
                    child: body,
                  ),
                )
              : Padding(
                  padding: EdgeInsets.fromLTRB(
                    useSidePadding ? 16 : 0,
                    0,
                    useSidePadding ? 16 : 0,
                    0,
                  ),
                  child: body,
                ),
        ),
        drawer: drawer,
        bottomNavigationBar: bottomNavigationBar,
        floatingActionButton: floatingActionButton,
      ),
    );
  }
}
