"""
DroneAid 2026 - Data Preparation Script
Prepares the DroneAid symbol icons for YOLOv8 training
"""

import os
import shutil
from pathlib import Path
import yaml
from PIL import Image, ImageDraw, ImageFilter
import random
import numpy as np

# Symbol classes
CLASSES = [
    'children',
    'elderly',
    'firstaid',
    'food',
    'ok',
    'shelter',
    'sos',
    'water'
]

def create_synthetic_dataset(icons_dir, output_dir, num_images_per_class=100):
    """
    Create a synthetic dataset by placing icons on various backgrounds
    with augmentations (rotation, scale, position, lighting)
    """
    print("Creating synthetic training dataset...")
    
    # Create directory structure
    images_dir = Path(output_dir) / 'images'
    labels_dir = Path(output_dir) / 'labels'
    
    for split in ['train', 'val']:
        (images_dir / split).mkdir(parents=True, exist_ok=True)
        (labels_dir / split).mkdir(parents=True, exist_ok=True)
    
    # Background sizes
    bg_sizes = [(640, 480), (800, 600), (1024, 768), (1280, 720)]
    
    img_count = 0
    
    for class_idx, class_name in enumerate(CLASSES):
        icon_path = Path(icons_dir) / f'icon-{class_name}.png'
        
        if not icon_path.exists():
            print(f"Warning: Icon not found: {icon_path}")
            continue
        
        # Load icon
        icon = Image.open(icon_path).convert('RGBA')
        
        # Generate images for this class
        for i in range(num_images_per_class):
            # Determine train/val split (80/20)
            split = 'train' if i < num_images_per_class * 0.8 else 'val'
            
            # Random background size
            bg_width, bg_height = random.choice(bg_sizes)
            
            # Create background (varying shades of gray, concrete, grass-like textures)
            bg_type = random.choice(['solid', 'gradient', 'noisy'])
            
            if bg_type == 'solid':
                bg_color = random.randint(40, 220)
                background = Image.new('RGB', (bg_width, bg_height), (bg_color, bg_color, bg_color))
            elif bg_type == 'gradient':
                background = Image.new('RGB', (bg_width, bg_height))
                pixels = np.zeros((bg_height, bg_width, 3), dtype=np.uint8)
                for y in range(bg_height):
                    color = int(100 + (y / bg_height) * 100)
                    pixels[y, :] = [color, color, color]
                background = Image.fromarray(pixels)
            else:  # noisy
                bg_base = random.randint(80, 180)
                pixels = np.random.randint(-30, 30, (bg_height, bg_width, 3)) + bg_base
                pixels = np.clip(pixels, 0, 255).astype(np.uint8)
                background = Image.fromarray(pixels)
            
            # Random scale (50% to 150% of original size)
            scale = random.uniform(0.5, 1.5)
            new_size = (int(icon.width * scale), int(icon.height * scale))
            scaled_icon = icon.resize(new_size, Image.LANCZOS)
            
            # Random rotation
            angle = random.uniform(-30, 30)
            rotated_icon = scaled_icon.rotate(angle, expand=True, fillcolor=(0, 0, 0, 0))
            
            # Random position (ensure icon fits)
            max_x = max(0, bg_width - rotated_icon.width)
            max_y = max(0, bg_height - rotated_icon.height)
            x = random.randint(0, max_x) if max_x > 0 else 0
            y = random.randint(0, max_y) if max_y > 0 else 0
            
            # Paste icon onto background
            background.paste(rotated_icon, (x, y), rotated_icon)
            
            # Add slight blur or noise occasionally
            if random.random() < 0.2:
                background = background.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 2.0)))
            
            # Calculate YOLO format bounding box
            # YOLO format: class_id x_center y_center width height (all normalized 0-1)
            bbox_width = rotated_icon.width / bg_width
            bbox_height = rotated_icon.height / bg_height
            bbox_x_center = (x + rotated_icon.width / 2) / bg_width
            bbox_y_center = (y + rotated_icon.height / 2) / bg_height
            
            # Save image
            img_filename = f'{class_name}_{i:04d}.jpg'
            img_path = images_dir / split / img_filename
            background.convert('RGB').save(img_path, quality=85)
            
            # Save label
            label_filename = f'{class_name}_{i:04d}.txt'
            label_path = labels_dir / split / label_filename
            with open(label_path, 'w') as f:
                f.write(f'{class_idx} {bbox_x_center:.6f} {bbox_y_center:.6f} {bbox_width:.6f} {bbox_height:.6f}\n')
            
            img_count += 1
            if img_count % 100 == 0:
                print(f"Generated {img_count} images...")
    
    print(f"Dataset creation complete! Generated {img_count} total images.")
    return img_count

def create_dataset_yaml(output_dir):
    """Create the dataset YAML configuration file for YOLOv8"""
    
    yaml_content = {
        'path': str(Path(output_dir).absolute()),
        'train': 'images/train',
        'val': 'images/val',
        'nc': len(CLASSES),
        'names': CLASSES
    }
    
    yaml_path = Path(output_dir) / 'dataset.yaml'
    with open(yaml_path, 'w') as f:
        yaml.dump(yaml_content, f, default_flow_style=False)
    
    print(f"Dataset configuration saved to {yaml_path}")
    return yaml_path

def main():
    # Paths
    icons_dir = Path('./assets/icons')
    output_dir = Path('./data/droneaid_dataset')
    
    # Create dataset
    num_images = create_synthetic_dataset(icons_dir, output_dir, num_images_per_class=150)
    
    # Create YAML config
    yaml_path = create_dataset_yaml(output_dir)
    
    print("\n" + "="*60)
    print("Dataset preparation complete!")
    print(f"Total images generated: {num_images}")
    print(f"Dataset config: {yaml_path}")
    print(f"Train images: {output_dir}/images/train/")
    print(f"Val images: {output_dir}/images/val/")
    print("="*60)

if __name__ == '__main__':
    main()
