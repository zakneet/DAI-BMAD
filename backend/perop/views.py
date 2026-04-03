from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from common.permissions import IsPerOpStaffGroup
from rest_framework.response import Response

from audit.services import create_audit_log
from casefile.models import AnesthesiaCase
from .models import (
    PerOpSession,
    PerOpSessionStatus,
    VitalSignMeasurement,
    PerOpEvent,
)
from .serializers import (
    PerOpSessionSerializer,
    StartPerOpSessionSerializer,
    EndPerOpSessionSerializer,
    VitalSignMeasurementSerializer,
    PerOpEventSerializer,
    PerOpSummarySerializer,
)


class PerOpCaseViewSet(viewsets.GenericViewSet):
    queryset = AnesthesiaCase.objects.select_related(
        "patient",
        "perop_session",
    ).all()
    permission_classes = [IsPerOpStaffGroup]
    serializer_class = serializers.Serializer

    @action(detail=True, methods=["get"], url_path="summary")
    def summary(self, request, pk=None):
        case = self.get_object()

        session = getattr(case, "perop_session", None)
        latest_vitals = []
        latest_events = []

        if session:
            latest_vitals = session.vital_measurements.all()[:20]
            latest_events = session.events.select_related(
                "medication_administration"
            ).all()[:20]

        serializer = PerOpSummarySerializer(
            {
                "case_id": case.id,
                "case_status": case.status,
                "session": session,
                "latest_vitals": latest_vitals,
                "latest_events": latest_events,
            }
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="sessions/start")
    def start_session(self, request, pk=None):
        case = self.get_object()
        serializer = StartPerOpSessionSerializer(
            data=request.data,
            context={"case": case},
        )
        serializer.is_valid(raise_exception=True)

        started_at = serializer.validated_data.get("started_at", timezone.now())
        notes = serializer.validated_data.get("notes", "")

        session = PerOpSession.objects.create(
            anesthesia_case=case,
            status=PerOpSessionStatus.ACTIVE,
            started_at=started_at,
            notes=notes,
        )

        create_audit_log(
            action="START_PEROP_SESSION",
            entity_type="PerOpSession",
            entity_id=str(session.id),
            actor=request.user.username if request.user.is_authenticated else "system",
            details={
                "case_id": str(case.id),
                "patient_id": str(case.patient.id),
                "started_at": started_at.isoformat(),
            },
        )

        return Response(
            PerOpSessionSerializer(session).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="sessions/end")
    def end_session(self, request, pk=None):
        case = self.get_object()
        serializer = EndPerOpSessionSerializer(
            data=request.data,
            context={"case": case},
        )
        serializer.is_valid(raise_exception=True)

        session = case.perop_session
        ended_at = serializer.validated_data.get("ended_at", timezone.now())
        notes = serializer.validated_data.get("notes")

        session.status = PerOpSessionStatus.ENDED
        session.ended_at = ended_at
        if notes is not None:
            session.notes = notes
        session.save()

        create_audit_log(
            action="END_PEROP_SESSION",
            entity_type="PerOpSession",
            entity_id=str(session.id),
            actor=request.user.username if request.user.is_authenticated else "system",
            details={
                "case_id": str(case.id),
                "patient_id": str(case.patient.id),
                "ended_at": ended_at.isoformat(),
            },
        )

        return Response(
            PerOpSessionSerializer(session).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get", "post"], url_path="vitals")
    def vitals(self, request, pk=None):
        case = self.get_object()

        if not hasattr(case, "perop_session"):
            return Response(
                {"detail": "No per-op session exists for this case."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = case.perop_session

        if request.method == "GET":
            queryset = session.vital_measurements.all().order_by("-recorded_at")
            serializer = VitalSignMeasurementSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        payload = request.data.copy()
        payload["session"] = str(session.id)

        serializer = VitalSignMeasurementSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        vital = serializer.save()

        create_audit_log(
            action="CREATE_VITAL_MEASUREMENT",
            entity_type="VitalSignMeasurement",
            entity_id=str(vital.id),
            actor=request.user.username if request.user.is_authenticated else "system",
            details={
                "case_id": str(case.id),
                "session_id": str(session.id),
                "vital_type": vital.vital_type,
                "value": str(vital.value),
                "unit": vital.unit,
                "recorded_at": vital.recorded_at.isoformat(),
            },
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"], url_path="events")
    def events(self, request, pk=None):
        case = self.get_object()

        if not hasattr(case, "perop_session"):
            return Response(
                {"detail": "No per-op session exists for this case."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = case.perop_session

        if request.method == "GET":
            queryset = session.events.select_related(
                "medication_administration"
            ).all().order_by("-timestamp")
            serializer = PerOpEventSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        payload = request.data.copy()
        payload["anesthesia_case"] = str(case.id)
        payload["session"] = str(session.id)

        serializer = PerOpEventSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        event = serializer.save()

        create_audit_log(
            action="CREATE_PEROP_EVENT",
            entity_type="PerOpEvent",
            entity_id=str(event.id),
            actor=request.user.username if request.user.is_authenticated else "system",
            details={
                "case_id": str(case.id),
                "session_id": str(session.id),
                "event_type": event.event_type,
                "title": event.title,
                "timestamp": event.timestamp.isoformat(),
            },
        )

        return Response(
            PerOpEventSerializer(event).data,
            status=status.HTTP_201_CREATED,
        )