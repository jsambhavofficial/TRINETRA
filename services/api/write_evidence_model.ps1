=[char]34
=New-Object System.Text.StringBuilder
function L(){[void].AppendLine()}
L (" from datetime import datetime\)
L (\from typing import Optional\)
L (\from sqlalchemy import DateTime Float ForeignKey Integer JSON String Text\)
L (\from sqlalchemy.orm import Mapped mapped_column relationship\)
L (\from app.models.base import TimeStampedModel\)
[System.IO.File]::WriteAllText(\C:\Users\user\Desktop\New folder\services\api\app\models\evidence.py\, .ToString(), [System.Text.Encoding]::UTF8)
Write-Host done