#!/bin/bash

# Check if an argument is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 /path/to/your/directory"
    exit 1
fi

# Get the directory from the argument
DIR="$1"

# Check if the directory exists
if [ ! -d "$DIR" ]; then
    echo "Error: Directory $DIR does not exist."
    exit 1
fi

# Loop through all JSON files in the directory
for json_file in "$DIR"/*.json; do
    python3 ./scripts/offchain/convert_into_img_script.py "$json_file" --img-ext ".png"
done
