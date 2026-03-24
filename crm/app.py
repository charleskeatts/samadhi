from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from pathlib import Path
from collections import defaultdict

# ── Database ──────────────────────────────────────────────────────────────────

DATABASE_URL = "sqlite:///./clairio.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── ORM Models ─────────────────────────────────────────────────────────────────

class DealModel(Base):
    __tablename__ = "deals"
    id = Column(Integer, primary_key=True, index=True)
    account_name = Column(String(200), nullable=False)
    contact_name = Column(String(200))
    rep_name = Column(String(200))
    arr_amount = Column(Float, nullable=False)
    stage = Column(String(50), nullable=False)
    close_date = Column(String(10))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    signals = relationship("SignalModel", back_populates="deal", cascade="all, delete-orphan")


class SignalModel(Base):
    __tablename__ = "signals"
    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    signal_type = Column(String(20), nullable=False)  # FEATURE | COMPETITOR | PRICING | COMPLIANCE
    feature_name = Column(String(200))
    competitor_name = Column(String(200))
    description = Column(Text, nullable=False)
    confidence = Column(String(10), default="HIGH")   # HIGH | MEDIUM | LOW
    is_deal_blocker = Column(Boolean, default=False)
    timeline_pressure = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    deal = relationship("DealModel", back_populates="signals")


Base.metadata.create_all(bind=engine)

# ── Pydantic Schemas ───────────────────────────────────────────────────────────

class DealCreate(BaseModel):
    account_name: str
    contact_name: Optional[str] = None
    rep_name: Optional[str] = None
    arr_amount: float
    stage: str
    close_date: Optional[str] = None
    notes: Optional[str] = None


class DealOut(BaseModel):
    id: int
    account_name: str
    contact_name: Optional[str]
    rep_name: Optional[str]
    arr_amount: float
    stage: str
    close_date: Optional[str]
    notes: Optional[str]
    created_at: datetime
    signal_count: int = 0

    class Config:
        from_attributes = True


class SignalCreate(BaseModel):
    signal_type: str
    feature_name: Optional[str] = None
    competitor_name: Optional[str] = None
    description: str
    confidence: str = "HIGH"
    is_deal_blocker: bool = False
    timeline_pressure: bool = False


class SignalOut(BaseModel):
    id: int
    deal_id: int
    signal_type: str
    feature_name: Optional[str]
    competitor_name: Optional[str]
    description: str
    confidence: str
    is_deal_blocker: bool
    timeline_pressure: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RadarEntry(BaseModel):
    feature_name: str
    signal_type: str
    total_weighted_arr: float
    deal_count: int
    severity: str
    deals: List[dict]


# ── Dependency ────────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── ARR Weighting (from Clairio_Sales_Brain_v1.md) ────────────────────────────

def compute_weighted_arr(deal_arr: float, signal: SignalModel) -> float:
    w = deal_arr
    if signal.is_deal_blocker:
        w *= 1.5
    if signal.signal_type == "COMPLIANCE":
        w *= 1.3
    if signal.competitor_name:
        w *= 1.2
    if signal.timeline_pressure:
        w *= 1.2
    if signal.confidence == "LOW":
        w *= 0.6
    elif signal.confidence == "MEDIUM":
        w *= 0.8
    return w


def get_severity(weighted_arr: float, deal_count: int) -> str:
    if weighted_arr > 2_000_000 or deal_count > 15:
        return "CRITICAL"
    if weighted_arr > 500_000 or deal_count > 8:
        return "HIGH"
    return "MEDIUM"


# ── FastAPI App ────────────────────────────────────────────────────────────────

app = FastAPI(title="Clairio CRM")

# ── Deal Routes ────────────────────────────────────────────────────────────────

@app.get("/api/deals", response_model=List[DealOut])
def list_deals(db: Session = Depends(get_db)):
    deals = db.query(DealModel).order_by(DealModel.created_at.desc()).all()
    return [
        DealOut(
            id=d.id, account_name=d.account_name, contact_name=d.contact_name,
            rep_name=d.rep_name, arr_amount=d.arr_amount, stage=d.stage,
            close_date=d.close_date, notes=d.notes, created_at=d.created_at,
            signal_count=len(d.signals),
        )
        for d in deals
    ]


@app.post("/api/deals", response_model=DealOut, status_code=201)
def create_deal(deal: DealCreate, db: Session = Depends(get_db)):
    d = DealModel(**deal.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return DealOut(**deal.model_dump(), id=d.id, created_at=d.created_at, signal_count=0)


@app.get("/api/deals/{deal_id}", response_model=DealOut)
def get_deal(deal_id: int, db: Session = Depends(get_db)):
    d = db.query(DealModel).filter(DealModel.id == deal_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Deal not found")
    return DealOut(
        id=d.id, account_name=d.account_name, contact_name=d.contact_name,
        rep_name=d.rep_name, arr_amount=d.arr_amount, stage=d.stage,
        close_date=d.close_date, notes=d.notes, created_at=d.created_at,
        signal_count=len(d.signals),
    )


@app.put("/api/deals/{deal_id}", response_model=DealOut)
def update_deal(deal_id: int, deal: DealCreate, db: Session = Depends(get_db)):
    d = db.query(DealModel).filter(DealModel.id == deal_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Deal not found")
    for k, v in deal.model_dump().items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return DealOut(**deal.model_dump(), id=d.id, created_at=d.created_at, signal_count=len(d.signals))


@app.delete("/api/deals/{deal_id}", status_code=204)
def delete_deal(deal_id: int, db: Session = Depends(get_db)):
    d = db.query(DealModel).filter(DealModel.id == deal_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(d)
    db.commit()


# ── Signal Routes ──────────────────────────────────────────────────────────────

@app.get("/api/deals/{deal_id}/signals", response_model=List[SignalOut])
def list_signals(deal_id: int, db: Session = Depends(get_db)):
    return (
        db.query(SignalModel)
        .filter(SignalModel.deal_id == deal_id)
        .order_by(SignalModel.created_at.desc())
        .all()
    )


@app.post("/api/deals/{deal_id}/signals", response_model=SignalOut, status_code=201)
def create_signal(deal_id: int, signal: SignalCreate, db: Session = Depends(get_db)):
    if not db.query(DealModel).filter(DealModel.id == deal_id).first():
        raise HTTPException(status_code=404, detail="Deal not found")
    s = SignalModel(deal_id=deal_id, **signal.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@app.delete("/api/signals/{signal_id}", status_code=204)
def delete_signal(signal_id: int, db: Session = Depends(get_db)):
    s = db.query(SignalModel).filter(SignalModel.id == signal_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Signal not found")
    db.delete(s)
    db.commit()


# ── Radar Route ────────────────────────────────────────────────────────────────

@app.get("/api/radar", response_model=List[RadarEntry])
def get_radar(db: Session = Depends(get_db)):
    signals = (
        db.query(SignalModel)
        .join(DealModel)
        .filter(SignalModel.feature_name.isnot(None), SignalModel.feature_name != "")
        .all()
    )

    groups: dict = defaultdict(lambda: {"weighted_arr": 0.0, "deals": {}, "signal_type": "FEATURE"})

    for sig in signals:
        key = sig.feature_name.strip().lower()
        groups[key]["weighted_arr"] += compute_weighted_arr(sig.deal.arr_amount, sig)
        groups[key]["signal_type"] = sig.signal_type
        groups[key]["deals"][sig.deal_id] = {
            "id": sig.deal.id,
            "account_name": sig.deal.account_name,
            "arr_amount": sig.deal.arr_amount,
            "stage": sig.deal.stage,
        }

    return sorted(
        [
            RadarEntry(
                feature_name=k.title(),
                signal_type=v["signal_type"],
                total_weighted_arr=v["weighted_arr"],
                deal_count=len(v["deals"]),
                severity=get_severity(v["weighted_arr"], len(v["deals"])),
                deals=list(v["deals"].values()),
            )
            for k, v in groups.items()
        ],
        key=lambda x: x.total_weighted_arr,
        reverse=True,
    )


# ── Seed Data ──────────────────────────────────────────────────────────────────

def seed_data(db: Session):
    if db.query(DealModel).count() > 0:
        return

    deals_raw = [
        {"account_name": "NVIDIA",       "contact_name": "Jensen Huang",         "rep_name": "Charles Keatts", "arr_amount": 850000,  "stage": "Negotiation", "close_date": "2026-04-15", "notes": "Strong interest in AI pipeline features. IT security review in progress."},
        {"account_name": "Salesforce",   "contact_name": "Marc Benioff",          "rep_name": "Sarah Lin",      "arr_amount": 620000,  "stage": "Proposal",    "close_date": "2026-05-01", "notes": "Comparing against Gong. Procurement requires SSO and SOC2 before contract."},
        {"account_name": "Airbnb",       "contact_name": "Brian Chesky",          "rep_name": "Mike Torres",    "arr_amount": 390000,  "stage": "Discovery",   "close_date": "2026-06-30", "notes": "Early stage. VP Sales wants flexible reporting. Budget sensitive."},
        {"account_name": "BNP Paribas",  "contact_name": "Jean-Laurent Bonnafé", "rep_name": "Charles Keatts", "arr_amount": 1200000, "stage": "Negotiation", "close_date": "2026-04-30", "notes": "Compliance-driven buyer. Audit logs and EU data residency are hard regulatory requirements."},
        {"account_name": "Lyft",         "contact_name": "David Risher",          "rep_name": "Sarah Lin",      "arr_amount": 275000,  "stage": "Proposal",    "close_date": "2026-05-15", "notes": "Budget tight. CFO pushing back on price. Competitor comparison with Chorus."},
        {"account_name": "Elastic",      "contact_name": "Ash Kulkarni",          "rep_name": "Mike Torres",    "arr_amount": 510000,  "stage": "Negotiation", "close_date": "2026-04-20", "notes": "SSO confirmed as the main blocker. Engineering also asking about API access."},
        {"account_name": "Intel",        "contact_name": "Pat Gelsinger",         "rep_name": "Charles Keatts", "arr_amount": 980000,  "stage": "Proposal",    "close_date": "2026-05-30", "notes": "Large deal. Global IT policy requires SSO for all SaaS. Procurement checklist includes SOC2."},
        {"account_name": "AMD",          "contact_name": "Lisa Su",               "rep_name": "Sarah Lin",      "arr_amount": 440000,  "stage": "Discovery",   "close_date": "2026-07-01", "notes": "Compared Clairio against Crayon. Needs real-time alerts and custom dashboards."},
    ]

    created = []
    for d in deals_raw:
        deal = DealModel(**d)
        db.add(deal)
        db.flush()
        created.append(deal)

    signals_raw = [
        # NVIDIA
        (0, "COMPLIANCE", "SSO / SAML",          None,      "IT security requires SAML SSO before procurement approval.",                    "HIGH",   True,  True),
        (0, "FEATURE",    "API Access",           None,      "Engineering team wants REST API for custom integrations.",                       "MEDIUM", False, False),
        # Salesforce
        (1, "COMPETITOR", "SSO / SAML",           "Gong",    "Mentioned Gong has native SSO. Asked if we can match it.",                      "HIGH",   True,  True),
        (1, "COMPLIANCE", "SOC2 Certification",   None,      "Legal requires SOC2 Type II before contract can be signed.",                    "HIGH",   True,  True),
        # Airbnb
        (2, "FEATURE",    "Advanced Reporting",   None,      "VP Sales wants a custom report builder — current dashboards not flexible.",     "MEDIUM", False, False),
        (2, "PRICING",    None,                   None,      "Budget is tight. Asked if there's a simpler tier at lower price.",              "HIGH",   False, False),
        # BNP Paribas
        (3, "COMPLIANCE", "Audit Logs",           None,      "Compliance team requires complete audit logs of all data access. Hard reg req.", "HIGH",  True,  True),
        (3, "COMPLIANCE", "Data Residency",       None,      "Data must remain in EU. No US data transfer allowed. Legal hard requirement.",  "HIGH",   True,  True),
        # Lyft
        (4, "COMPETITOR", "Real-time Alerts",     "Chorus",  "Chorus was cited as having better real-time deal-change alerting.",            "MEDIUM", False, False),
        (4, "PRICING",    None,                   None,      "CFO: 'We don't need all the features — just want something simpler and cheaper.'","HIGH", True,  False),
        # Elastic
        (5, "COMPLIANCE", "SSO / SAML",           None,      "IT won't approve without SSO. Rep confirmed this is the deal blocker.",         "HIGH",   True,  True),
        (5, "FEATURE",    "API Access",           None,      "Wants webhooks and REST API to connect with internal tooling.",                 "HIGH",   False, False),
        # Intel
        (6, "COMPLIANCE", "SSO / SAML",           None,      "Global IT policy: SSO required for all SaaS tools. No exceptions.",            "HIGH",   True,  True),
        (6, "COMPLIANCE", "SOC2 Certification",   None,      "Procurement checklist includes SOC2. Won't proceed without it.",               "HIGH",   True,  False),
        # AMD
        (7, "COMPETITOR", "Real-time Alerts",     "Crayon",  "Crayon cited as having better real-time competitive intelligence alerts.",     "MEDIUM", False, False),
        (7, "FEATURE",    "Advanced Reporting",   None,      "Needs custom dashboards per regional sales team.",                             "MEDIUM", False, False),
    ]

    for deal_idx, stype, fname, comp, desc, conf, blocker, timeline in signals_raw:
        db.add(SignalModel(
            deal_id=created[deal_idx].id,
            signal_type=stype,
            feature_name=fname,
            competitor_name=comp,
            description=desc,
            confidence=conf,
            is_deal_blocker=blocker,
            timeline_pressure=timeline,
        ))

    db.commit()


with SessionLocal() as _db:
    seed_data(_db)

# ── Serve Frontend ─────────────────────────────────────────────────────────────

STATIC_DIR = Path(__file__).parent / "static"

@app.get("/")
def serve_index():
    return FileResponse(STATIC_DIR / "index.html")

app.mount("/assets", StaticFiles(directory=str(STATIC_DIR)), name="assets")
