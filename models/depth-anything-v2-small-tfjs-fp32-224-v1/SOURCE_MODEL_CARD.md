---
library_name: keras-hub
---
### Model Overview
# Model Summary
Depth Anything V2 is a family of monocular depth estimation (MDE) models that represent a significant leap forward in generating high-quality, fine-grained depth maps from single images. Built upon the success of the original Depth Anything, V2 is trained on a massive dataset comprising 595K synthetic labeled images and over 62M real unlabeled images. This hybrid training strategy allows the model to capture intricate details while remaining robust to diverse real-world scenarios. Depth-Anything-V2 is designed to be a versatile backbone for any computer vision pipeline requiring spatial awareness, offering three main variants (Small, Base, and Large) to balance performance and computational cost.

# Key Features
*   **Superior Detail:** Captures more fine-grained details and thinner structures than previous state-of-the-art models.
*   **Robustness:** Demonstrates high reliability across various lighting conditions, indoor/outdoor scenes, and complex occlusions.
*   **High Efficiency:** Optimized architecture that is significantly faster and more lightweight than stable diffusion-based depth models.
*   **Scalable Variants:** Provides multiple model sizes to fit everything from edge devices to high-performance servers.
*   **Flexible Integration:** Designed for easy integration into downstream tasks like 3D reconstruction, autonomous driving, and image editing.

### Training Strategies
Depth-Anything-V2 utilizes a "Large-Scale Unlabeled Data" approach combined with high-quality synthetic data. The synthetic data provides precise ground-truth depth labels, while the unlabeled real images allow the model to learn a broad and robust representation of the physical world. The training pipeline focuses on relative depth estimation with a high degree of zero-shot generalization.

Weights for the Small variant are released under the Apache 2.0 License, while the Base and Large variants are released under the CC-BY-NC-4.0 License.

---

## Links
*   [Depth Anything V2 Paper](https://arxiv.org/abs/2406.09414)
*   [KerasHub Beginner Guide](https://keras.io/keras_hub/)

---

## Installation
Keras and KerasHub can be installed with:

```bash
pip install -U -q keras-hub
pip install -U -q keras
```

---

## Available Depth-Anything-V2 Presets
The following model checkpoints are available. Use the preset names below to load the models.

| Preset | Parameters | Description |
| :--- | :--- | :--- |
| `depth_anything_v2_small` | ~24.8M | The most lightweight variant, based on ViT-Small. Ideal for real-time mobile and edge applications. |
| `depth_anything_v2_base` | ~97.5M | A mid-sized model based on ViT-Base. Offers a strong balance between speed and precision. |
| `depth_anything_v2_large` | ~335.3M | The most powerful variant based on ViT-Large. Delivers state-of-the-art accuracy and fine-grained depth detail. |

---

## Example Usage
```python
import keras
import numpy as np
import requests
from PIL import Image

from keras_hub.src.models.depth_anything.depth_anything_depth_estimator import (
    DepthAnythingDepthEstimator,
)

image = Image.open(requests.get("http://images.cocodataset.org/val2017/000000039769.jpg", stream=True).raw)
image = image.resize((518, 518))
depth_estimator = DepthAnythingDepthEstimator.from_preset(
    "depth_anything_v2_base,
    depth_estimation_type="relative",
    max_depth=None,
)
images = np.expand_dims(np.array(image).astype("float32"), axis=0)
outputs = depth_estimator.predict({"images": images})["depths"]
depth = keras.ops.nn.relu(outputs[0, ..., 0])
depth = (depth - keras.ops.min(depth)) / (
    keras.ops.max(depth) - keras.ops.min(depth)
)
depth = keras.ops.convert_to_numpy(depth) * 255
Image.fromarray(depth.astype("uint8")).save("depth_map.png")
```

## Example Usage with Hugging Face URI

```python
import keras
import numpy as np
import requests
from PIL import Image

from keras_hub.src.models.depth_anything.depth_anything_depth_estimator import (
    DepthAnythingDepthEstimator,
)

image = Image.open(requests.get("http://images.cocodataset.org/val2017/000000039769.jpg", stream=True).raw)
image = image.resize((518, 518))
depth_estimator = DepthAnythingDepthEstimator.from_preset(
    "depth_anything_v2_base,
    depth_estimation_type="relative",
    max_depth=None,
)
images = np.expand_dims(np.array(image).astype("float32"), axis=0)
outputs = depth_estimator.predict({"images": images})["depths"]
depth = keras.ops.nn.relu(outputs[0, ..., 0])
depth = (depth - keras.ops.min(depth)) / (
    keras.ops.max(depth) - keras.ops.min(depth)
)
depth = keras.ops.convert_to_numpy(depth) * 255
Image.fromarray(depth.astype("uint8")).save("depth_map.png")
```
