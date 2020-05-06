var express = require('express');

const queryToGetAllRelevantPromos = "WITH numUsedPreProcess as (\n" +
    "\tSELECT pid, CASE\n" +
    "\t\tWHEN EXISTS (\n" +
    "\t\t\tSELECT 1\n" +
    "\t\t\tFROM Orders o1\n" +
    "\t\t\tWHERE o1.pid = p1.pid\n" +
    "\t\t) THEN (\n" +
    "\t\t\tSELECT count(*)\n" +
    "\t\t\tFROM Orders o2\n" +
    "\t\t\tWHERE o2.pid = p1.pid\n" +
    "\t\t) ELSE 0\n" +
    "\t\tEND AS num\n" +
    "\tFROM Promotions p1\n" +
    "), relevantFDSPromos as (\n" +
    "\tSELECT promo_cat as type, promo_rate as disc, promo_type as disc_type, promo_details_text as detail\n" +
    "\tFROM FDS_Promotions fp1\n" +
    "\tWHERE now()::timestamp BETWEEN start_datetime AND end_datetime\n" +
    "\tAND promo_max_num_redemption IS NULL \n" +
    "\tOR (promo_max_num_redemption IS NOT NULL \n" +
    "\t\tAND promo_max_num_redemption > (\n" +
    "\t\tSELECT nupp2.num\n" +
    "\t\tFROM numUsedPreProcess nupp2\n" +
    "\t\tWHERE nupp2.pid = fp1.pid\n" +
    "\t\t)\n" +
    "\t)\n" +
    ")\n" +
    "\n" +
    "SELECT promo_cat as type, promo_rate as disc, promo_type as disc_type, promo_details_text as details \n" +
    "FROM Restaurant_Promotions rp1\n" +
    "WHERE rp1.rid = $1\n" +
    "AND now()::timestamp BETWEEN start_datetime AND end_datetime\n" +
    "AND rp1.promo_max_num_redemption > (\n" +
    "\tSELECT nupp1.num\n" +
    "\tFROM numUsedPreProcess nupp1\n" +
    "\tWHERE nupp1.pid = rp1.pid\n" +
    ")\n" +
    "UNION\n" +
    "SELECT *\n" +
    "FROM relevantFDSPromos"

const getAllRelevantPromos = (req, res, db) => {
    const rid = req.query.rid;
    console.log(rid);
    const output = db.query(queryToGetAllRelevantPromos, [rid],
        (error,  results) => {
            if (error) {
                console.log(error)
            }

            res.status(200).json(results.rows)
        })
}

const queryToGetAllPromoStatisticsForStaffPage =
    "with unionPromo as (\n" +
    "select *\n" +
    "from Restaurant_Promotions\n" +
    "WHERE rid = $1\n" +
    "),\n" +
    "usePromo as (\n" +
    "select u1.pid, COALESCE(count(*), 0) as totalCount, EXTRACT(day from (end_datetime-start_datetime)) as promoDuration\n" +
    "from unionPromo u1 left join orders o1\n" +
    "on u1.pid = o1.pid\n" +
    "group by u1.pid, start_datetime, end_datetime\n" +
    ")\n" +
    "select u2.pid, promo_details_text,start_datetime, end_datetime, promo_type, promo_cat, promoDuration as duration, totalCount/promoDuration as avgOrders,\n" +
    "promo_min_cost, promo_rate, promo_max_discount_limit, promo_max_num_redemption\n" +
    "from usePromo u2, unionPromo z1\n" +
    "where u2.pid = z1.pid"

const getAllPromoStatisticsForStaffPage = (req, res, db) => {
    const rid = req.query.rid;
    console.log(rid);
    const output = db.query(queryToGetAllPromoStatisticsForStaffPage, [rid],
        (error,  results) => {
            if (error) {
                console.log(error)
            }

            res.status(200).json(results.rows)
        })
}


module.exports = {
    getAllRelevantPromos: getAllRelevantPromos,
    getAllPromoStatisticsForStaffPage: getAllPromoStatisticsForStaffPage,
};































/*
WITH numUsedPreProcess as (
	SELECT pid, CASE
		WHEN EXISTS (
			SELECT 1
			FROM Orders o1
			WHERE o1.pid = p1.pid
		) THEN (
			SELECT count(*)
			FROM Orders o2
			WHERE o2.pid = p1.pid
		) ELSE 0
		END AS num
	FROM Promotions p1
), relevantFDSPromos as (
	SELECT promo_cat as type, promo_rate as disc, promo_type as disc_type, promo_details_text as detail
	FROM FDS_Promotions fp1
	WHERE now()::timestamp BETWEEN start_datetime AND end_datetime
	AND promo_max_num_redemption IS NULL
	OR (promo_max_num_redemption IS NOT NULL
		AND promo_max_num_redemption > (
		SELECT nupp2.num
		FROM numUsedPreProcess nupp2
		WHERE nupp2.pid = fp1.pid
		)
	)
)

SELECT promo_cat as type, promo_rate as disc, promo_type as disc_type, promo_details_text as details
FROM Restaurant_Promotions rp1
WHERE rp1.rid = 4
AND now()::timestamp BETWEEN start_datetime AND end_datetime
AND rp1.promo_max_num_redemption > (
	SELECT nupp1.num
	FROM numUsedPreProcess nupp1
	WHERE nupp1.pid = rp1.pid
)
UNION
SELECT *
FROM relevantFDSPromos
 */