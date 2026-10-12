import httpx

client = httpx.Client(base_url="http://localhost:8000/api/v1", timeout=15.0)

print("--- STEP 1: AI MODEL AUTO-ASSIST ---")
ai_res = client.post("/intelligence/ai/classify", json={
    "title": "Severe waterlogging at Subhash Chowk underpass",
    "description": "Water level rising above 40cm, traffic halted, pump intake choked with silt",
    "district_id": "HR-GU"
})
assert ai_res.status_code == 200, f"AI Classify failed: {ai_res.text}"
ai_data = ai_res.json()
s_cat = ai_data["classification"]["suggested_category"]
s_dept = ai_data["routing"]["suggested_department_id"]
s_dept_name = ai_data["routing"]["suggested_department_name"]
print(f"Predicted Category: {s_cat} ({round(ai_data['classification']['confidence'] * 100)}%)")
print(f"Suggested Department: {s_dept_name} ({s_dept})")
print(f"Routing Justification: {ai_data['routing']['justification']}")
print(f"Taxonomy Rationale: {ai_data['classification']['reason']}")

print("\n--- STEP 2: CITIZEN LODGES COMPLAINT ---")
cit_login = client.post("/auth/login", json={
    "email": "citizen.rohit@trinetra.gov.in",
    "password": "Citizen@2026"
}).json()
cit_token = cit_login["access_token"]

cmp_res = client.post("/complaints", headers={"Authorization": f"Bearer {cit_token}"}, json={
    "category": s_cat,
    "title": "Severe Waterlogging at Subhash Chowk Underpass",
    "description": "Water level rising above 40cm, traffic halted, pump intake choked with silt",
    "district_id": "HR-GU",
    "department_id": s_dept,
    "latitude": 28.4350,
    "longitude": 77.0380,
    "address": "Subhash Chowk, Sohna Road, Sector 38, Gurugram",
    "citizen_name": "Rohit Verma",
    "citizen_phone": "+91-98100-11223"
})
assert cmp_res.status_code == 201, f"Create complaint failed: {cmp_res.text}"
cmp = cmp_res.json()
cid = cmp["id"]
tracking_id = cmp["tracking_id"]
print(f"Complaint Created: ID={cid}, Tracking={tracking_id}, Status={cmp['status']}")

print("\n--- STEP 3: DEPARTMENT RECEIVES & ASSIGNS FIELD UNIT ---")
dept_login = client.post("/auth/login", json={
    "email": "pwd.lead@trinetra.gov.in",
    "password": "Department@2026"
}).json()
dept_token = dept_login["access_token"]

assign_res = client.post(f"/complaints/{cid}/assign", headers={"Authorization": f"Bearer {dept_token}"}, json={
    "assigned_unit_id": "UNIT-AMB-01",
    "assigned_officer_name": "Inspector Sandeep Rao",
    "priority": "CRITICAL"
})
assert assign_res.status_code == 200, f"Assign failed: {assign_res.text}"
print(f"Assigned to UNIT-AMB-01. Status={assign_res.json()['status']}")

print("\n--- STEP 4: FIELD OFFICER ACCEPTS & SUBMITS PROOF ---")
field_login = client.post("/auth/login", json={
    "email": "field.amb01@trinetra.gov.in",
    "password": "Field@2026"
}).json()
field_token = field_login["access_token"]

prog_res = client.post(f"/complaints/{cid}/field-progress", headers={"Authorization": f"Bearer {field_token}"}, json={
    "status": "IN_PROGRESS",
    "note": "High-capacity mobile dewatering pump deployed at underpass south bay."
})
assert prog_res.status_code == 200

resolve_res = client.post(f"/complaints/{cid}/submit-proof", headers={"Authorization": f"Bearer {field_token}"}, json={
    "before_photo": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800",
    "after_photo": "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800",
    "field_note": "Dewatering complete, silt cleared, dual lane reopened for traffic.",
    "location_confirmed": True
})
assert resolve_res.status_code == 200, f"Submit proof failed: {resolve_res.text}"
print(f"Proof Submitted! Status={resolve_res.json()['status']}, Validation={resolve_res.json()['validation_status']}")

print("\n--- STEP 5: AUTHORIZED SUPERVISOR VERIFIES & APPROVES ---")
val_res = client.post(f"/complaints/{cid}/validate-resolution", headers={"Authorization": f"Bearer {dept_token}"}, json={
    "decision": "APPROVE"
})
assert val_res.status_code == 200, f"Validation failed: {val_res.text}"
print(f"Supervisor Decision: APPROVED. Status={val_res.json()['status']}")

print("\n--- STEP 6: CITIZEN SEES LIVE UPDATED STATUS & RATES ---")
track_res = client.get(f"/complaints/track/{tracking_id}").json()
print(f"Public Tracker Status: {track_res['status']}")
print(f"Current Stage: {track_res['stage_label']}")
print(f"Milestones Completed: {len([m for m in track_res['milestones'] if m['completed']])} / 6")

feedback_res = client.post(f"/complaints/{cid}/feedback", headers={"Authorization": f"Bearer {cit_token}"}, json={
    "rating": 5,
    "comments": "Superb turnaround time, water cleared within 2 hours!"
})
assert feedback_res.status_code == 200
print("Citizen 5-Star Rating Submitted Successfully!")

print("\n=======================================================")
print(" ALL STEPS PASSED 100%: CITIZEN -> DEPT -> FIELD -> SUPERVISOR -> CITIZEN")
print("=======================================================")
