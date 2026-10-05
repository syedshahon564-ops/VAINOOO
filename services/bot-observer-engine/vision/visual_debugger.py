from PIL import Image, ImageOps, ImageFilter
import numpy as np

class VisualDebugger:
    @staticmethod
    def preprocess_for_ocr(cropped_image: Image.Image) -> Image.Image:
        """Enhance white text contrast against dynamic Free Fire battle backgrounds"""
        # 1. Grayscale
        gray = ImageOps.grayscale(cropped_image)
        # 2. Increase contrast
        contrast = ImageOps.autocontrast(gray, cutoff=2)
        # 3. Simple thresholding to extract bright white kill-feed text
        np_img = np.array(contrast)
        binary = np.where(np_img > 180, 255, 0).astype(np.uint8)
        return Image.fromarray(binary)
