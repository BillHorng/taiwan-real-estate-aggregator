from datetime import date
from scripts.connectors.moi_real_price import read_zip
from scripts.normalize.moi_real_price import normalize, roc_date
from scripts.validate.models import RealPriceRecord

def row():
    return {"縣市":"臺北市", "鄉鎮市區":"大安區", "編號":"ABC", "移轉編號":"001", "交易年月日":"1150102", "建築完成年月":"1000102",
            "總價元":"20000000", "單價元平方公尺":"200000", "建物移轉總面積平方公尺":"100", "土地移轉總面積平方公尺":"20",
            "交易標的":"房地(土地+建物)", "建物型態":"住宅大樓", "主要用途":"住家用", "建物現況格局-房":"3", "建物現況格局-廳":"2",
            "建物現況格局-衛":"2", "土地位置建物門牌":"和平東路", "移轉層次":"五層", "總樓層數":"十二層", "車位類別":"坡道平面", "車位總價元":"2000000", "備註":""}

def test_normalizes_real_price_record():
    item = normalize(row())
    validated = RealPriceRecord.model_validate(item)
    assert validated.transaction_date == date(2026, 1, 2)
    assert validated.building_area_ping == 30.25
    assert round(validated.unit_price_ping or 0) == 661157
    assert validated.rooms == 3

def test_rejects_missing_identity_or_date():
    broken = row() | {"編號":""}
    assert normalize(broken) is None
    assert roc_date("not-a-date") is None
