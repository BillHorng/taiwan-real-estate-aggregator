from __future__ import annotations
from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

class Property(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    source_id: str
    source_name: str
    source_url: HttpUrl
    external_listing_id: str
    title: str
    description: str | None
    property_category: Literal["land", "building", "mixed", "unknown"]
    transaction_type: Literal["government_sale", "auction", "sale"]
    county: str | None
    district: str | None
    address: str | None
    address_precision: Literal["land_parcel", "district", "unknown"]
    latitude: float | None = Field(ge=-90, le=90)
    longitude: float | None = Field(ge=-180, le=180)
    location_precision: Literal["exact", "approximate", "district", "none"]
    total_price: float | None = Field(ge=0)
    unit_price: float | None = Field(ge=0)
    building_area_ping: float | None = Field(ge=0)
    land_area_ping: float | None = Field(ge=0)
    building_age: float | None = Field(ge=0)
    floor: str | None
    rooms: float | None = Field(ge=0)
    bathrooms: float | None = Field(ge=0)
    parking: str | None
    auction_type: str | None
    auction_round: int | None = Field(ge=1)
    auction_date: date | None
    reserve_price: float | None = Field(ge=0)
    final_price: float | None = None
    deposit: float | None = Field(ge=0)
    case_number: str | None
    ownership_share: str | None
    handover_status: str | None
    listing_status: Literal["upcoming", "ended", "suspended", "unknown"]
    first_seen_at: datetime
    last_seen_at: datetime
    last_verified_at: datetime
    source_updated_at: date | datetime | None
    data_quality_score: float = Field(ge=0, le=1)
    duplicate_group_id: str | None = None
    duplicate_confidence: float | None = Field(default=None, ge=0, le=1)
    duplicate_match_basis: list[str] = Field(default_factory=list)
    source_details: dict[str, str | None] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_location(self) -> "Property":
        has_latitude = self.latitude is not None
        has_longitude = self.longitude is not None
        if has_latitude != has_longitude:
            raise ValueError("latitude and longitude must be provided together")
        if self.location_precision == "none" and (has_latitude or has_longitude):
            raise ValueError("location_precision cannot be none when coordinates exist")
        if self.location_precision != "none" and not (has_latitude and has_longitude):
            raise ValueError("coordinates are required when location_precision is not none")
        return self

class RealPriceRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    source_id: Literal["moi-lvr"]
    source_url: HttpUrl
    county: str
    district: str
    address: str | None
    transaction_date: date
    transaction_target: str
    building_type: str | None
    primary_use: str | None
    total_price: float = Field(ge=0)
    unit_price_sqm: float | None = Field(ge=0)
    unit_price_ping: float | None = Field(ge=0)
    building_area_ping: float | None = Field(ge=0)
    land_area_ping: float | None = Field(ge=0)
    building_age: float | None = Field(ge=0)
    floor: str | None
    total_floors: str | None
    rooms: int | None = Field(ge=0)
    halls: int | None = Field(ge=0)
    bathrooms: int | None = Field(ge=0)
    parking_type: str | None
    parking_price: float | None = Field(ge=0)
    notes: str | None
    external_id: str

class RealPriceTrendPoint(BaseModel):
    model_config = ConfigDict(extra="forbid")
    season: str = Field(pattern=r"^\d{3}S[1-4]$")
    label: str
    county: str
    district: str
    building_type: str
    count: int = Field(gt=0)
    median_unit_price: float = Field(gt=0)
    median_total_price: float = Field(ge=0)
    min_unit_price: float = Field(gt=0)
    max_unit_price: float = Field(gt=0)

class AdminCentroid(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source_id: Literal["nlsc-town-boundaries"]
    town_code: str = Field(min_length=1)
    county: str = Field(min_length=2)
    district: str = Field(min_length=1)
    latitude: float = Field(ge=10, le=27)
    longitude: float = Field(ge=114, le=125)
    location_precision: Literal["district"]
