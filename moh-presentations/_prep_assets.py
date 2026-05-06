"""Resize and copy all images needed by the website into website/assets/."""
from PIL import Image
from pathlib import Path
import shutil

ROOT = Path(r"g:\Downloads\PSD + Potential foil layers\new edits")
SITE = ROOT / "discord_export" / "website"
ASSETS = SITE / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

# (src_path, out_name, max_long_edge_px, quality)
JOBS = [
    # --- Discord today images (already small enough for web) ---
    (ROOT / "discord_export" / "today" / "01_product_photo_final_cards_hero_18cards_with_packs.png", "01_hero_18cards.jpg", 2200, 88),
    (ROOT / "discord_export" / "today" / "04_product_photo_cards_on_desk_with_macbook_inoffice.jpg", "04_desk_macbook.jpg", 2200, 88),
    (ROOT / "discord_export" / "today" / "05_product_photo_shipping_box_full_of_booster_packs.jpg", "05_shipbox.jpg", 2000, 86),
    (ROOT / "discord_export" / "today" / "06_production_photo_bulk_card_stacks_rubberbanded_factory.jpg", "06_bulk_stacks.jpg", 2000, 86),
    (ROOT / "discord_export" / "today" / "07_supplier_chat_wechat_first_contact_anthony.png", "07_chat_first.jpg", 1100, 84),
    (ROOT / "discord_export" / "today" / "08_supplier_chat_wechat_qr_code_specs_15_unique.png", "08_chat_qr.jpg", 1100, 84),
    (ROOT / "discord_export" / "today" / "11_production_photo_factory_full_card_sheet_print_proof_friday.jpg", "11_print_bed.jpg", 2200, 88),
    (ROOT / "discord_export" / "today" / "13_production_photo_print_proof_moh_pack_cover_closeup.jpg", "13_pack_closeup.jpg", 2000, 86),
    (ROOT / "discord_export" / "today" / "14_supplier_chat_wechat_shipped_tracking_freebies.png", "14_chat_shipped.jpg", 1100, 84),
    (ROOT / "discord_export" / "today" / "15_product_photo_shipping_box_top_view_packs.jpg", "15_box_top.jpg", 2000, 86),
    (ROOT / "discord_export" / "today" / "16_production_photo_factory_booster_packs_long_row_assembly.png", "16_assembly.jpg", 2000, 86),
    (ROOT / "discord_export" / "today" / "17_card_artwork_azathoth_card_art_on_screen.jpg", "17_azathoth_screen.jpg", 1800, 86),
    (ROOT / "discord_export" / "today" / "18_design_file_tuckbox_psd_in_photoshop_lovecraft.jpg", "18_tuckbox_psd.jpg", 1800, 86),
    (ROOT / "discord_export" / "today" / "19_research_xiaohongshu_supplier_listing_research.png", "19_xhs.jpg", 1100, 84),
    (ROOT / "discord_export" / "today" / "20_research_foil_layer_3versions_explainer_anime.jpg", "20_foil_layers_ref.jpg", 1400, 86),
    (ROOT / "discord_export" / "today" / "21_supplier_chat_wechat_foil_specs_63x88_to_66x91_AI_workflow.png", "21_chat_specs.jpg", 1100, 84),
    (ROOT / "discord_export" / "today" / "22_supplier_chat_wechat_file_naming_convention_300dpi_jpg.png", "22_chat_naming.jpg", 1100, 84),
    (ROOT / "discord_export" / "today" / "23_supplier_chat_wechat_bag_dimensions_cmyk_only.png", "23_chat_bag.jpg", 1100, 84),
    (ROOT / "discord_export" / "today" / "24_supplier_chat_wechat_text_must_be_designed_in_AI.png", "24_chat_text_AI.jpg", 1100, 84),
    (ROOT / "discord_export" / "today" / "25_supplier_chat_wechat_packaging_safe_zone_13mm.png", "25_chat_safezone.jpg", 1100, 84),
    (ROOT / "discord_export" / "today" / "26_payment_alipay_payment_failed_yw1128_appeal.png", "26_pay_failed.jpg", 1100, 84),
    (ROOT / "discord_export" / "today" / "27_design_file_final_delivery_folder_structure_AI_files.png", "27_delivery_folder.jpg", 1600, 86),
    (ROOT / "discord_export" / "today" / "28_design_file_fortunato_silhouette_vs_final_card.png", "28_fortunato.jpg", 1400, 88),
    (ROOT / "discord_export" / "today" / "29_supplier_chat_wechat_quantity_4500_3000_packs.png", "29_chat_qty.jpg", 1100, 84),
    (ROOT / "discord_export" / "today" / "30_payment_payment_confirm_apple_pay_USD1700.png", "30_pay_apple.jpg", 1100, 84),
    (ROOT / "discord_export" / "today" / "31_research_gumball_pack_reference_competitor.jpg", "31_gumball.jpg", 1600, 86),
    (ROOT / "discord_export" / "today" / "32_payment_alipay_checkout_9000_account_missing_error.png", "32_pay_error.jpg", 1100, 84),
    # --- Manual (chat-pasted) images ---
    (ROOT / "discord_export" / "today" / "manual" / "33_dm_psd_share_april5_foil_explainer.png", "33_dm_psd_share.jpg", 1400, 86),
    (ROOT / "discord_export" / "today" / "manual" / "34_dm_foil_blisters_nail_in_coffin.png", "34_dm_buyin.jpg", 1400, 86),
    (ROOT / "discord_export" / "today" / "manual" / "35_design_file_ai_node_graph_mask_workflow.jpg", "35_ai_node_graph.jpg", 2400, 88),
    (ROOT / "discord_export" / "today" / "manual" / "36_dm_mask_qa_feedback_anthony.png", "36_dm_qa.jpg", 1400, 86),
    (ROOT / "discord_export" / "today" / "manual" / "37_product_photo_melon_before_after_comparison.jpg", "37_melon_before_after.jpg", 2200, 90),
    (ROOT / "discord_export" / "today" / "manual" / "38_dm_pretending_to_be_anthony_4_9.png", "38_dm_anthony_yes.jpg", 1100, 86),
    # --- Local project assets (the real source material!) ---
    (ROOT / "lovecraft package.png", "lovecraft_pack.jpg", 2400, 90),
    (ROOT / "poe packaging.png", "poe_pack.jpg", 2400, 90),
    (ROOT / "MoH_Card_Delivery" / "MoH_Card_Delivery" / "mask_overlay_sheets" / "overlay_page_1.png", "overlay_page_1.jpg", 1600, 88),
    (ROOT / "MoH_Card_Delivery" / "MoH_Card_Delivery" / "mask_overlay_sheets" / "overlay_page_2.png", "overlay_page_2.jpg", 1600, 88),
    (ROOT / "MoH_Card_Delivery" / "MoH_Card_Delivery" / "mask_overlay_sheets" / "overlay_page_3.png", "overlay_page_3.jpg", 1600, 88),
]

ok = 0
miss = 0
for src, name, max_edge, q in JOBS:
    src = Path(str(src))
    if not src.exists():
        # Try alt MoH_Card_Delivery path inside project root
        alt = ROOT / "MoH_Card_Delivery" / src.name
        if alt.exists():
            src = alt
        else:
            print(f"MISS: {src}")
            miss += 1
            continue
    out = ASSETS / name
    try:
        with Image.open(src) as im:
            im = im.convert("RGB")
            w, h = im.size
            scale = min(1.0, max_edge / max(w, h))
            if scale < 1.0:
                im = im.resize((int(w*scale), int(h*scale)), Image.LANCZOS)
            im.save(out, "JPEG", quality=q, optimize=True, progressive=True)
        kb = out.stat().st_size / 1024
        print(f"OK : {name:34s} {im.size[0]}x{im.size[1]}  {kb:.0f} KB")
        ok += 1
    except Exception as e:
        print(f"FAIL {src.name}: {e}")
        miss += 1

print(f"\nDone. ok={ok} miss={miss}  out={ASSETS}")
