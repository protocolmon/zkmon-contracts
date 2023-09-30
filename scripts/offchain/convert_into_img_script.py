import numpy as np
import os
import argparse
import json
from PIL import Image

if __name__ == "__main__":

    # --- Basic argparse ---
    parser = argparse.ArgumentParser(
        description="Convert Polymon JSON file into image")
    parser.add_argument(
        "json_path", type=str,
        help="The path to the JSON metadata for the image to be converted")
    parser.add_argument(
        "--img-ext", type=str, default=".png",
        help="Extension for the image to be saved into")
    args = parser.parse_args()

    print(args.json_path)
    img_filename = args.json_path[:-len(".json")] + args.img_ext

    # --- JSON metadata path must exist, and image path should not exist ---
    assert os.path.exists(args.json_path)
    # assert not os.path.exists(img_filename)

    with open(args.json_path, "r") as json_file:
        # Images: Transpose from (CWH --> HWC)
        img_arr = np.uint8(np.asarray(json.load(json_file)["image"]).reshape((3, 64, 64)).transpose(2, 1, 0))
        np_img = Image.fromarray(img_arr).convert("RGB")
        print(f"Saving generated image to {img_filename}...")
        np_img.save(img_filename)
        print(f"All done!")