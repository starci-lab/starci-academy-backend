#!/bin/sh
# Pipeline comment strict modules 1-11 (coding-rules §4)
node scratch/apply_module_11_feed_rules.mjs
node scratch/polish_comment_format_1_11.mjs
node scratch/comment_system_design_modules_1_11.mjs 1 11
node scratch/polish_comment_format_1_11.mjs
