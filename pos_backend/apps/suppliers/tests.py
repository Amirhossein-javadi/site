from rest_framework import status
from rest_framework.test import APITestCase

from apps.suppliers.models import Supplier
from apps.tenants.models import Company
from apps.users.models import User


class SupplierApiTests(APITestCase):
    def setUp(self):
        self.company = Company.objects.create(name="شرکت اول", slug="supplier-company-one")
        self.other_company = Company.objects.create(name="شرکت دوم", slug="supplier-company-two")
        self.user = User.objects.create_user(
            email="supplier-user@example.com", password="test-password", tenant=self.company,
            role=User.Role.WAREHOUSE,
        )
        self.client.force_authenticate(self.user)
        self.supplier = Supplier.objects.create(
            tenant=self.company, name="تأمین پارس", code="PAR-1", phone="02100000000"
        )
        self.other_supplier = Supplier.objects.create(
            tenant=self.other_company, name="تأمین دیگر", code="OTH-1"
        )

    def test_list_search_and_status_filter_are_tenant_scoped(self):
        response = self.client.get("/api/suppliers/?search=پارس&status=active")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data], [self.supplier.id])

    def test_create_update_and_delete_supplier(self):
        created = self.client.post(
            "/api/suppliers/",
            {
                "name": "تأمین جدید",
                "code": "NEW-1",
                "contact_person": "علی رضایی",
                "phone": "09120000000",
                "lead_time_days": 4,
                "status": "active",
            },
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Supplier.objects.get(pk=created.data["id"]).tenant, self.company)

        updated = self.client.patch(
            f"/api/suppliers/{created.data['id']}/",
            {"status": "suspended", "lead_time_days": 9},
            format="json",
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(updated.data["status"], "suspended")
        self.assertEqual(updated.data["lead_time_days"], 9)

        deleted = self.client.delete(f"/api/suppliers/{created.data['id']}/")
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Supplier.objects.filter(code="NEW-1").exists())

    def test_duplicate_code_is_reported_as_validation_error(self):
        response = self.client.post(
            "/api/suppliers/",
            {"name": "تأمین تکراری", "code": self.supplier.code},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("code", response.data)

    def test_other_tenant_supplier_cannot_be_read_or_changed(self):
        response = self.client.get(f"/api/suppliers/{self.other_supplier.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.client.patch(
            f"/api/suppliers/{self.other_supplier.id}/", {"name": "دستکاری"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.other_supplier.refresh_from_db()
        self.assertEqual(self.other_supplier.name, "تأمین دیگر")

    def test_api_requires_authentication(self):
        self.client.force_authenticate(None)

        response = self.client.get("/api/suppliers/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
