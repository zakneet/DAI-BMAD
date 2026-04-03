from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from common.permissions import IsPostOpStaffGroup
from rest_framework.response import Response

from audit.services import create_audit_log
from casefile.models import AnesthesiaCase
from preop.models import ClinicalScore, ScoreType
from .models import PostOpStay, PostOpStayStatus, PostOpObservation
from .serializers import (
    PostOpStaySerializer,
    StartPostOpStaySerializer,
    EndPostOpStaySerializer,
    PostOpObservationSerializer,
    AldreteScoreSerializer,
    PostOpSummarySerializer,
)


class PostOpCaseViewSet(viewsets.GenericViewSet):
    queryset = AnesthesiaCase.objects.select_related(
        "patient",
        "postop_stay",
    ).all()
    permission_classes = [IsPostOpStaffGroup]
    serializer_class = serializers.Serializer

    @action(detail=True, methods=["get"], url_path="summary")
    def summary(self, request, pk=None):
        case = self.get_object()

        stay = getattr(case, "postop_stay", None)
        latest_observations = []

        if stay:
            latest_observations = stay.observations.all()[:20]

        serializer = PostOpSummarySerializer(
            {
                "case_id": case.id,
                "case_status": case.status,
                "stay": stay,
                "latest_observations": latest_observations,
            }
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="stay/start")
    def start_stay(self, request, pk=None):
        case = self.get_object()
        serializer = StartPostOpStaySerializer(
            data=request.data,
            context={"case": case},
        )
        serializer.is_valid(raise_exception=True)

        started_at = serializer.validated_data.get("started_at", timezone.now())
        notes = serializer.validated_data.get("notes", "")

        stay = PostOpStay.objects.create(
            anesthesia_case=case,
            status=PostOpStayStatus.ACTIVE,
            started_at=started_at,
            notes=notes,
        )

        create_audit_log(
            action="START_POSTOP_STAY",
            entity_type="PostOpStay",
            entity_id=str(stay.id),
            actor=request.user.username if request.user.is_authenticated else "system",
            details={
                "case_id": str(case.id),
                "patient_id": str(case.patient.id),
                "started_at": started_at.isoformat(),
            },
        )

        return Response(
            PostOpStaySerializer(stay).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="stay/end")
    def end_stay(self, request, pk=None):
        case = self.get_object()
        serializer = EndPostOpStaySerializer(
            data=request.data,
            context={"case": case},
        )
        serializer.is_valid(raise_exception=True)

        stay = case.postop_stay
        ended_at = serializer.validated_data.get("ended_at", timezone.now())
        notes = serializer.validated_data.get("notes")

        stay.status = PostOpStayStatus.ENDED
        stay.ended_at = ended_at
        if notes is not None:
            stay.notes = notes
        stay.save()

        create_audit_log(
            action="END_POSTOP_STAY",
            entity_type="PostOpStay",
            entity_id=str(stay.id),
            actor=request.user.username if request.user.is_authenticated else "system",
            details={
                "case_id": str(case.id),
                "patient_id": str(case.patient.id),
                "ended_at": ended_at.isoformat(),
            },
        )

        return Response(
            PostOpStaySerializer(stay).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get", "post"], url_path="observations")
    def observations(self, request, pk=None):
        case = self.get_object()

        if not hasattr(case, "postop_stay"):
            return Response(
                {"detail": "No post-op stay exists for this case."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        stay = case.postop_stay

        if request.method == "GET":
            queryset = stay.observations.all().order_by("-observation_time")
            serializer = PostOpObservationSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        payload = request.data.copy()
        payload["stay"] = str(stay.id)

        serializer = PostOpObservationSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        observation = serializer.save()

        aldrete_score = observation.aldrete_score
        readiness = "READY_FOR_DISCHARGE" if aldrete_score >= 9 else "NOT_READY"

        clinical_score, _ = ClinicalScore.objects.update_or_create(
            anesthesia_case=case,
            score_type=ScoreType.ALDERETE if hasattr(ScoreType, "ALDERETE") else "ALDRETE",
            defaults={
                "score_value": str(aldrete_score),
                "score_details": {
                    "method": "postop_observation_based",
                    "readiness": readiness,
                    "observation_id": str(observation.id),
                    "components": {
                        "activity": observation.activity_score,
                        "respiration": observation.respiration_score,
                        "circulation": observation.circulation_score,
                        "consciousness": observation.consciousness_score,
                        "oxygenation": observation.oxygenation_score,
                    },
                    "pain_score": observation.pain_score,
                    "observation_time": observation.observation_time.isoformat(),
                },
            },
        )

        create_audit_log(
            action="CREATE_POSTOP_OBSERVATION",
            entity_type="PostOpObservation",
            entity_id=str(observation.id),
            actor=request.user.username if request.user.is_authenticated else "system",
            details={
                "case_id": str(case.id),
                "stay_id": str(stay.id),
                "observation_time": observation.observation_time.isoformat(),
                "aldrete_score": aldrete_score,
                "pain_score": observation.pain_score,
            },
        )

        return Response(
            {
                "observation": PostOpObservationSerializer(observation).data,
                "aldrete_score": aldrete_score,
                "readiness": readiness,
                "clinical_score_id": str(clinical_score.id),
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="scores/aldrete")
    def aldrete(self, request, pk=None):
        case = self.get_object()

        stay = getattr(case, "postop_stay", None)
        latest_observation = None
        aldrete_score = 0
        readiness = "NOT_READY"
        clinical_score_payload = {}

        if stay:
            latest_observation = stay.observations.order_by("-observation_time").first()

        if latest_observation:
            aldrete_score = latest_observation.aldrete_score
            readiness = "READY_FOR_DISCHARGE" if aldrete_score >= 9 else "NOT_READY"

            clinical_score_payload = {
                "score_type": "ALDRETE",
                "score_value": str(aldrete_score),
                "score_details": {
                    "readiness": readiness,
                    "observation_id": str(latest_observation.id),
                },
            }

        serializer = AldreteScoreSerializer(
            {
                "case_id": case.id,
                "stay_id": stay.id if stay else None,
                "latest_observation": latest_observation,
                "aldrete_score": aldrete_score,
                "readiness": readiness,
                "clinical_score": clinical_score_payload,
            }
        )
        return Response(serializer.data, status=status.HTTP_200_OK)