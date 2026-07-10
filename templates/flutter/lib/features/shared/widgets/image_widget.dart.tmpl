import 'package:{{packageName}}/core/core.dart';

class ImageWidget extends StatelessWidget {
  const ImageWidget({
    super.key,
    required this.url,
    this.fit = BoxFit.contain,
    this.height,
    this.width,
    this.color,
    this.scale,
  });

  final String url;
  final BoxFit fit;
  final double? scale;
  final double? height;
  final double? width;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final imageType = url._detectImageType();

    return switch (imageType) {
      _ImageType.pngAsset ||
      _ImageType.jpgAsset ||
      _ImageType.webpAsset =>
        Image.asset(
          url,
          height: height,
          width: width,
          fit: fit,
          color: color,
          scale: scale,
        ),
      _ImageType.svgAsset => SvgPicture.asset(
          url,
          height: height,
          width: width,
          fit: fit,
          colorFilter:
              color != null ? ColorFilter.mode(color!, BlendMode.srcIn) : null,
        ),
      _ImageType.pngNetwork ||
      _ImageType.jpgNetwork ||
      _ImageType.webpNetwork =>
        Image.network(
          url,
          height: height,
          width: width,
          fit: fit,
          color: color,
          scale: scale ?? 1,
        ),
      _ImageType.svgNetwork => SvgPicture.network(
          url,
          height: height,
          width: width,
          fit: fit,
          colorFilter:
              color != null ? ColorFilter.mode(color!, BlendMode.srcIn) : null,
        ),
      _ImageType.unknown => const SizedBox.shrink(),
    };
  }
}

enum _ImageType {
  svgNetwork,
  svgAsset,
  pngNetwork,
  pngAsset,
  jpgNetwork,
  jpgAsset,
  webpNetwork,
  webpAsset,
  unknown,
}

extension _ImageTypeDetector on String {
  _ImageType _detectImageType() {
    final lower = toLowerCase();
    final isNetwork = lower.startsWith('http://') || lower.startsWith('https://');

    if (isNetwork) {
      if (lower.endsWith('.svg')) return _ImageType.svgNetwork;
      if (lower.endsWith('.png')) return _ImageType.pngNetwork;
      if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
        return _ImageType.jpgNetwork;
      }
      if (lower.endsWith('.webp')) return _ImageType.webpNetwork;
      return _ImageType.pngNetwork;
    }

    if (lower.endsWith('.svg')) return _ImageType.svgAsset;
    if (lower.endsWith('.png')) return _ImageType.pngAsset;
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      return _ImageType.jpgAsset;
    }
    if (lower.endsWith('.webp')) return _ImageType.webpAsset;
    return _ImageType.unknown;
  }
}
