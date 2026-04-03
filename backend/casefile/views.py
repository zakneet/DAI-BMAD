from rest_framework import viewsets, status
from rest_framework.decorators import action
from common.permissions import IsClinicalStaffGroup
from rest_framework.response import Response

from audit.services import create_audit_log
from .models import AnesthesiaCase, CaseStatus
from .serializers import (
    AnesthesiaCaseSerializer,
    CaseStateTransitionSerializer,
    CaseFullSummarySerializer,
)


class AnesthesiaCaseViewSet(viewsets.ModelViewSet):
    queryset = AnesthesiaCase.objects.select_related("patient").all()
    serializer_class = AnesthesiaCaseSerializer
    permission_classes = [IsClinicalStaffGroup]

    def perform_create(self, serializer):
        case = serializer.save()
        create_audit_log(
            action="CREATE",
            entity_type="AnesthesiaCase",
            entity_id=str(case.id),
            details={
                "patient_id": str(case.patient.id),
                "status": case.status,
                "surgery_type": case.surgery_type,
            },
        )

    def perform_update(self, serializer):
        case = serializer.save()
        create_audit_log(
            action="UPDATE",
            entity_type="AnesthesiaCase",
            entity_id=str(case.id),
            details={
                "patient_id": str(case.patient.id),
                "status": case.status,
                "surgery_type": case.surgery_type,
            },
        )

    @action(detail=True, methods=["post"], url_path="state")
    def change_state(self, request, pk=None):
        case = self.get_object()
        serializer = CaseStateTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]
        old_status = case.status

        allowed_transitions = {
            CaseStatus.PRE_OP: [CaseStatus.PER_OP],
            CaseStatus.PER_OP: [CaseStatus.POST_OP],
            CaseStatus.POST_OP: [CaseStatus.CLOSED],
            CaseStatus.CLOSED: [],
        }

        if new_status == old_status:
            return Response(
                {"detail": "Case is already in this status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status not in allowed_transitions.get(old_status, []):
            return Response(
                {"detail": f"Invalid transition from {old_status} to {new_status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        case.status = new_status
        case.save(update_fields=["status", "updated_at"])

        create_audit_log(
            action="STATE_TRANSITION",
            entity_type="AnesthesiaCase",
            entity_id=str(case.id),
            details={
                "patient_id": str(case.patient.id),
                "from_status": old_status,
                "to_status": new_status,
            },
        )

        output_serializer = self.get_serializer(case)
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="full-summary")
    def full_summary(self, request, pk=None):
        case = self.get_object()

        preop_questionnaire = getattr(case, "preop_questionnaire", None)
        clinical_scores = case.clinical_scores.all().order_by("score_type")

        perop_session = getattr(case, "perop_session", None)
        perop_vitals = []
        perop_events = []
        if perop_session:
            perop_vitals = perop_session.vital_measurements.all().order_by("-recorded_at")[:50]
            perop_events = perop_session.events.all().order_by("-timestamp")[:50]

        postop_stay = getattr(case, "postop_stay", None)
        postop_observations = []
        if postop_stay:
            postop_observations = postop_stay.observations.all().order_by("-observation_time")[:50]

        alerts = case.alerts.all().order_by("-raised_at")

        serializer = CaseFullSummarySerializer(
            {
                "case": case,
                "patient": case.patient,
                "preop_questionnaire": preop_questionnaire,
                "clinical_scores": clinical_scores,
                "perop_session": perop_session,
                "perop_vitals": perop_vitals,
                "perop_events": perop_events,
                "postop_stay": postop_stay,
                "postop_observations": postop_observations,
                "alerts": alerts,
            }
        )
        return Response(serializer.data, status=status.HTTP_200_OK)