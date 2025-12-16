# Scrape All Malaysian States

This file contains commands to scrape rental property data from all 16 states and federal territories in Malaysia.

## Available Regions & Commands

### Method 1: Individual State Commands

Run each command separately to scrape data from a specific state:

```bash
# 1. Johor
poetry run scrapy crawl fazwazrent -a region=johor

# 2. Kedah
poetry run scrapy crawl fazwazrent -a region=kedah

# 3. Kelantan
poetry run scrapy crawl fazwazrent -a region=kelantan

# 4. Melaka
poetry run scrapy crawl fazwazrent -a region=melaka

# 5. Negeri Sembilan
poetry run scrapy crawl fazwazrent -a region=negeri-sembilan

# 6. Pahang
poetry run scrapy crawl fazwazrent -a region=pahang

# 7. Perak
poetry run scrapy crawl fazwazrent -a region=perak

# 8. Perlis
poetry run scrapy crawl fazwazrent -a region=perlis

# 9. Penang
poetry run scrapy crawl fazwazrent -a region=penang

# 10. Sabah
poetry run scrapy crawl fazwazrent -a region=sabah

# 11. Sarawak
poetry run scrapy crawl fazwazrent -a region=sarawak

# 12. Selangor
poetry run scrapy crawl fazwazrent -a region=selangor

# 13. Terengganu
poetry run scrapy crawl fazwazrent -a region=terengganu

# 14. Kuala Lumpur
poetry run scrapy crawl fazwazrent -a region=kuala-lumpur

# 15. Putrajaya
poetry run scrapy crawl fazwazrent -a region=putrajaya

# 16. Labuan
poetry run scrapy crawl fazwazrent -a region=labuan
```

---

### Method 2: Batch Script (Windows)

Save these commands to a `.bat` file and run it:

```batch
@echo off
echo Starting batch scrape of all Malaysian states...

poetry run scrapy crawl fazwazrent -a region=johor
echo Johor completed!

poetry run scrapy crawl fazwazrent -a region=kedah
echo Kedah completed!

poetry run scrapy crawl fazwazrent -a region=kelantan
echo Kelantan completed!

poetry run scrapy crawl fazwazrent -a region=melaka
echo Melaka completed!

poetry run scrapy crawl fazwazrent -a region=negeri-sembilan
echo Negeri Sembilan completed!

poetry run scrapy crawl fazwazrent -a region=pahang
echo Pahang completed!

poetry run scrapy crawl fazwazrent -a region=perak
echo Perak completed!

poetry run scrapy crawl fazwazrent -a region=perlis
echo Perlis completed!

poetry run scrapy crawl fazwazrent -a region=penang
echo Penang completed!

poetry run scrapy crawl fazwazrent -a region=sabah
echo Sabah completed!

poetry run scrapy crawl fazwazrent -a region=sarawak
echo Sarawak completed!

poetry run scrapy crawl fazwazrent -a region=selangor
echo Selangor completed!

poetry run scrapy crawl fazwazrent -a region=terengganu
echo Terengganu completed!

poetry run scrapy crawl fazwazrent -a region=kuala-lumpur
echo Kuala Lumpur completed!

poetry run scrapy crawl fazwazrent -a region=putrajaya
echo Putrajaya completed!

poetry run scrapy crawl fazwazrent -a region=labuan
echo Labuan completed!

echo All regions completed!
pause
```

---

### Method 3: Shell Script (Mac/Linux)

Save these commands to a `.sh` file:

```bash
#!/bin/bash
echo "Starting batch scrape of all Malaysian states..."

poetry run scrapy crawl fazwazrent -a region=johor
echo "Johor completed!"

poetry run scrapy crawl fazwazrent -a region=kedah
echo "Kedah completed!"

poetry run scrapy crawl fazwazrent -a region=kelantan
echo "Kelantan completed!"

poetry run scrapy crawl fazwazrent -a region=melaka
echo "Melaka completed!"

poetry run scrapy crawl fazwazrent -a region=negeri-sembilan
echo "Negeri Sembilan completed!"

poetry run scrapy crawl fazwazrent -a region=pahang
echo "Pahang completed!"

poetry run scrapy crawl fazwazrent -a region=perak
echo "Perak completed!"

poetry run scrapy crawl fazwazrent -a region=perlis
echo "Perlis completed!"

poetry run scrapy crawl fazwazrent -a region=penang
echo "Penang completed!"

poetry run scrapy crawl fazwazrent -a region=sabah
echo "Sabah completed!"

poetry run scrapy crawl fazwazrent -a region=sarawak
echo "Sarawak completed!"

poetry run scrapy crawl fazwazrent -a region=selangor
echo "Selangor completed!"

poetry run scrapy crawl fazwazrent -a region=terengganu
echo "Terengganu completed!"

poetry run scrapy crawl fazwazrent -a region=kuala-lumpur
echo "Kuala Lumpur completed!"

poetry run scrapy crawl fazwazrent -a region=putrajaya
echo "Putrajaya completed!"

poetry run scrapy crawl fazwazrent -a region=labuan
echo "Labuan completed!"

echo "All regions completed!"
```

Make it executable and run:
```bash
chmod +x scrape_all.sh
./scrape_all.sh
```

---

### Method 4: All States at Once (No Region Filter)

To scrape ALL Malaysian states without specifying individual regions:

```bash
poetry run scrapy crawl fazwazrent
```

This will automatically scrape all available regions.

---

## Important Notes

1. **Each command generates a separate CSV file** - The output will be saved as `rentals.csv`. You'll need to rename or move each file after scraping:
   ```bash
   # After scraping Johor
   move rentals.csv rentals_johor.csv

   # Then scrape Kedah
   poetry run scrapy crawl fazwazrent -a region=kedah
   move rentals.csv rentals_kedah.csv

   # And so on...
   ```

2. **Combine CSV files** - After scraping all states, you can combine them:
   ```bash
   # Windows
   copy rentals_*.csv all_states_rentals.csv

   # Mac/Linux
   cat rentals_*.csv > all_states_rentals.csv
   ```

3. **Scraping takes time** - Each state can take 10-30 minutes depending on the number of listings.

4. **Be respectful** - The scraper has built-in delays (1 second between requests) to avoid overwhelming the website.

5. **Clear cache if needed** - If you encounter issues, clear the cache:
   ```bash
   # Windows
   rmdir /s /q .scrapy

   # Mac/Linux
   rm -rf .scrapy
   ```

---

## Quick Reference: All 16 States & Territories

| # | State/Territory | Command Value |
|---|-----------------|---------------|
| 1 | Johor | `johor` |
| 2 | Kedah | `kedah` |
| 3 | Kelantan | `kelantan` |
| 4 | Melaka | `melaka` |
| 5 | Negeri Sembilan | `negeri-sembilan` |
| 6 | Pahang | `pahang` |
| 7 | Perak | `perak` |
| 8 | Perlis | `perlis` |
| 9 | Penang | `penang` |
| 10 | Sabah | `sabah` |
| 11 | Sarawak | `sarawak` |
| 12 | Selangor | `selangor` |
| 13 | Terengganu | `terengganu` |
| 14 | Kuala Lumpur | `kuala-lumpur` |
| 15 | Putrajaya | `putrajaya` |
| 16 | Labuan | `labuan` |

---

## Tips

- Run commands one at a time to monitor progress
- Use `Ctrl+C` to stop a scrape if needed
- Check disk space before running all states (can generate 100MB+ of data)
- The scraper respects robots.txt and has delays to be polite to the website

---

Happy scraping! 🎉
